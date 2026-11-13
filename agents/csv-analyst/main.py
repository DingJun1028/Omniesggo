"""Conversational CSV data analyst agent.

The user shares a Google Drive link to a CSV. The agent resolves and downloads
the file through the google_drive_mcp connector (which acts as the session
user), then answers plain-language questions using a fixed set of read-only
analysis tools. No arbitrary code execution.
"""

from __future__ import annotations

import base64
import binascii
import io
import json
import re
import threading
from typing import Any, Literal

import pandas as pd
from mistralai import agents
from pydantic import BaseModel, Field

MAX_CSV_BYTES = 10 * 1024 * 1024
MAX_PREVIEW_ROWS = 100
MAX_GROUP_ROWS = 200

_LOCK = threading.Lock()
_SESSIONS: dict[str, dict[str, Any]] = {}

_FILE_ID_PATTERNS = (
    re.compile(r'/file/d/([A-Za-z0-9_-]{10,})'),
    re.compile(r'/d/([A-Za-z0-9_-]{10,})'),
    re.compile(r'[?&]id=([A-Za-z0-9_-]{10,})'),
    re.compile(r'^([A-Za-z0-9_-]{25,})$'),
)


def extract_file_id(text: str) -> str | None:
    text = text.strip()
    for pattern in _FILE_ID_PATTERNS:
        match = pattern.search(text)
        if match:
            return match.group(1)
    return None


def _records(df: pd.DataFrame) -> list[dict[str, Any]]:
    return json.loads(df.to_json(orient='records', date_format='iso'))


def _num(value: Any) -> float | None:
    if value is None or pd.isna(value):
        return None
    return float(value)


def _session_state(ctx: agents.ToolCallbackContext) -> dict[str, Any]:
    with _LOCK:
        return _SESSIONS.setdefault(ctx.session.id, {})


def _require_df(ctx: agents.ToolCallbackContext) -> tuple[dict[str, Any], pd.DataFrame]:
    state = _session_state(ctx)
    df = state.get('df')
    if not isinstance(df, pd.DataFrame):
        raise agents.ToolError(
            'No CSV is loaded in this conversation yet. Ask the user for the Google Drive '
            'link to a CSV, fetch it with the google_drive_mcp connector tools '
            '(search_files / get_file_metadata / download_file_content), then call load_csv.'
        )
    return state, df


def _require_column(df: pd.DataFrame, column: str) -> None:
    if column not in df.columns:
        raise agents.ToolError(f'Unknown column {column!r}. Available columns: {[str(c) for c in df.columns]}')


FilterOp = Literal[
    'eq',
    'ne',
    'gt',
    'gte',
    'lt',
    'lte',
    'contains',
    'not_contains',
    'isin',
    'not_isin',
    'isnull',
    'notnull',
]


class FilterCondition(BaseModel):
    column: str = Field(description='Column name exactly as listed by dataset_info / describe_columns.')
    op: FilterOp = Field(description='Comparison operator. isnull/notnull ignore value. isin/not_isin take a list in value.')
    value: Any = Field(default=None, description='Value to compare; a list for isin/not_isin; ignored for isnull/notnull.')


class LoadCsvInput(BaseModel):
    drive_url_or_file_id: str = Field(description='The Google Drive share link the user gave, or the bare file ID.')
    csv_base64: str = Field(description="The exact base64 string in the 'content' field returned by google_drive_mcp download_file_content for this file. Pass it unchanged.")
    file_name: str = Field(default='', description='File title from google_drive_mcp get_file_metadata, if known.')


@agents.tool(
    name='load_csv',
    description=(
        "Load a CSV from the user's Google Drive into this conversation. The content must first "
        'be downloaded with the google_drive_mcp connector (download_file_content returns base64 '
        "in 'content'); pass that base64 here unchanged. Replaces any CSV loaded earlier in this "
        'session. Returns file id, shape, columns, dtypes and a preview.'
    ),
    input_schema=LoadCsvInput,
    model_access='direct',
    annotations=agents.ToolAnnotations(read_only_hint=True),
)
def load_csv(ctx: agents.ToolCallbackContext, /, args: LoadCsvInput) -> dict[str, Any]:
    file_id = extract_file_id(args.drive_url_or_file_id)
    if not file_id:
        raise agents.ToolError(
            f'Could not extract a Google Drive file ID from {args.drive_url_or_file_id!r}. Expected a link like https://drive.google.com/file/d/<ID>/view or ?id=<ID>, or a bare file ID.'
        )
    try:
        raw = base64.b64decode(args.csv_base64, validate=True)
    except (binascii.Error, ValueError) as exc:
        raise agents.ToolError(f'csv_base64 is not valid base64: {exc}') from exc
    if len(raw) > MAX_CSV_BYTES:
        raise agents.ToolError(f'The file is {len(raw)} bytes, over the {MAX_CSV_BYTES} byte limit. Ask the user to share a smaller CSV or a sample of it.')
    text = raw.decode('utf-8-sig', errors='replace')
    try:
        df = pd.read_csv(io.StringIO(text), sep=None, engine='python')
    except Exception as exc:
        raise agents.ToolError(f'Could not parse the file as CSV: {exc}') from exc
    if df.empty:
        raise agents.ToolError('The CSV parsed but contains no data rows.')
    state = _session_state(ctx)
    with _LOCK:
        state['df'] = df
        state['file_id'] = file_id
        state['file_name'] = args.file_name or file_id
    return {
        'file_id': file_id,
        'file_name': state['file_name'],
        'rows': int(len(df)),
        'columns': [str(c) for c in df.columns],
        'dtypes': {str(c): str(t) for c, t in df.dtypes.items()},
        'preview': _records(df.head(5)),
    }


@agents.tool(
    name='dataset_info',
    description=('Show which CSV file is currently loaded in this conversation: file id, name, row count, columns and dtypes. Use it to recall the loaded file on follow-up questions.'),
    model_access='direct',
    annotations=agents.ToolAnnotations(read_only_hint=True),
)
def dataset_info(ctx: agents.ToolCallbackContext, /) -> dict[str, Any]:
    state, df = _require_df(ctx)
    return {
        'file_id': state.get('file_id'),
        'file_name': state.get('file_name'),
        'rows': int(len(df)),
        'columns': [str(c) for c in df.columns],
        'dtypes': {str(c): str(t) for c, t in df.dtypes.items()},
    }


class DescribeColumnsInput(BaseModel):
    columns: list[str] | None = Field(default=None, description='Subset of columns to describe; omit to describe all columns.')


@agents.tool(
    name='describe_columns',
    description=('Describe columns of the loaded CSV: dtype, null count, distinct count, and for numeric columns min/max/mean/median/std, for other columns the top 5 values with counts.'),
    input_schema=DescribeColumnsInput,
    model_access='direct',
    annotations=agents.ToolAnnotations(read_only_hint=True),
)
def describe_columns(ctx: agents.ToolCallbackContext, /, args: DescribeColumnsInput) -> dict[str, Any]:
    _, df = _require_df(ctx)
    columns = args.columns if args.columns else [str(c) for c in df.columns]
    described: dict[str, Any] = {}
    for column in columns:
        _require_column(df, column)
        series = df[column]
        info: dict[str, Any] = {
            'dtype': str(series.dtype),
            'null_count': int(series.isna().sum()),
            'distinct_count': int(series.nunique(dropna=True)),
        }
        if pd.api.types.is_numeric_dtype(series):
            info.update(
                min=_num(series.min()),
                max=_num(series.max()),
                mean=_num(series.mean()),
                median=_num(series.median()),
                std=_num(series.std()),
            )
        else:
            top = series.value_counts(dropna=True).head(5)
            info['top_values'] = {str(k): int(v) for k, v in top.items()}
        described[column] = info
    return {'rows': int(len(df)), 'columns': described}


class PreviewRowsInput(BaseModel):
    n: int = Field(default=10, ge=1, le=MAX_PREVIEW_ROWS, description='How many rows to return.')
    offset: int = Field(default=0, ge=0, description='Row offset to start from.')


@agents.tool(
    name='preview_rows',
    description='Return rows of the loaded CSV as records, starting at offset, at most 100 rows.',
    input_schema=PreviewRowsInput,
    model_access='direct',
    annotations=agents.ToolAnnotations(read_only_hint=True),
)
def preview_rows(ctx: agents.ToolCallbackContext, /, args: PreviewRowsInput) -> dict[str, Any]:
    _, df = _require_df(ctx)
    window = df.iloc[args.offset : args.offset + args.n]
    return {
        'total_rows': int(len(df)),
        'offset': args.offset,
        'returned': int(len(window)),
        'rows': _records(window),
    }


class FilterRowsInput(BaseModel):
    filters: list[FilterCondition] = Field(min_length=1, description='Conditions to combine.')
    logic: Literal['and', 'or'] = Field(default='and', description='How to combine the conditions.')
    preview: int = Field(default=20, ge=1, le=MAX_PREVIEW_ROWS, description='Max matched rows to return as a preview.')


def _apply_condition(df: pd.DataFrame, condition: FilterCondition) -> pd.Series:
    _require_column(df, condition.column)
    series = df[condition.column]
    op = condition.op
    if op == 'isnull':
        return series.isna()
    if op == 'notnull':
        return series.notna()
    if pd.api.types.is_numeric_dtype(series):
        value = pd.to_numeric(pd.Series([condition.value]), errors='coerce').iloc[0]
        if pd.isna(value):
            raise agents.ToolError(f'Column {condition.column!r} is numeric but value {condition.value!r} is not a number.')
        if op == 'eq':
            return series == value
        if op == 'ne':
            return series != value
        if op == 'gt':
            return series > value
        if op == 'gte':
            return series >= value
        if op == 'lt':
            return series < value
        if op == 'lte':
            return series <= value
        if op in ('isin', 'not_isin'):
            values = condition.value if isinstance(condition.value, list) else [condition.value]
            nums = pd.to_numeric(pd.Series(values), errors='coerce')
            mask = series.isin(nums.tolist())
            return mask if op == 'isin' else ~mask
        raise agents.ToolError(f'Operator {op!r} is not supported on numeric column {condition.column!r}.')
    text = series.astype(str)
    lowered = text.str.lower()
    if op == 'eq':
        return lowered == str(condition.value).lower()
    if op == 'ne':
        return lowered != str(condition.value).lower()
    if op == 'contains':
        return text.str.contains(str(condition.value), case=False, regex=False, na=False)
    if op == 'not_contains':
        return ~text.str.contains(str(condition.value), case=False, regex=False, na=False)
    if op in ('isin', 'not_isin'):
        values = condition.value if isinstance(condition.value, list) else [condition.value]
        wanted = [str(v).lower() for v in values]
        mask = lowered.isin(wanted)
        return mask if op == 'isin' else ~mask
    raise agents.ToolError(f'Operator {op!r} is not supported on text column {condition.column!r}.')


def _combine_filters(df: pd.DataFrame, filters: list[FilterCondition], logic: str) -> pd.Series:
    masks = [_apply_condition(df, condition) for condition in filters]
    combined = masks[0]
    for mask in masks[1:]:
        combined = (combined | mask) if logic == 'or' else (combined & mask)
    return combined


@agents.tool(
    name='filter_rows',
    description=(
        'Filter rows of the loaded CSV. Each condition is column + operator + value '
        '(eq, ne, gt, gte, lt, lte, contains, not_contains, isin, not_isin, isnull, notnull). '
        'Returns the matched row count and a preview of the matched rows.'
    ),
    input_schema=FilterRowsInput,
    model_access='direct',
    annotations=agents.ToolAnnotations(read_only_hint=True),
)
def filter_rows(ctx: agents.ToolCallbackContext, /, args: FilterRowsInput) -> dict[str, Any]:
    _, df = _require_df(ctx)
    mask = _combine_filters(df, args.filters, args.logic)
    matched = df[mask]
    return {
        'logic': args.logic,
        'matched_rows': int(len(matched)),
        'total_rows': int(len(df)),
        'preview': _records(matched.head(args.preview)),
    }


AggFunction = Literal['sum', 'mean', 'median', 'min', 'max', 'count', 'nunique', 'std']


class Aggregation(BaseModel):
    column: str = Field(description='Column to aggregate.')
    function: AggFunction = Field(description='count counts non-null values of the column; row_count (always included) counts rows per group.')


class GroupByInput(BaseModel):
    group_by: list[str] = Field(min_length=1, max_length=5, description='Columns to group by.')
    aggregations: list[Aggregation] = Field(min_length=1, max_length=10, description='Aggregations to compute per group.')
    filters: list[FilterCondition] = Field(default_factory=list, description='Optional row filters applied before grouping.')
    sort_by: str | None = Field(default=None, description="Output column to sort by, e.g. 'units__sum'. Omit for no sorting.")
    ascending: bool = Field(default=False, description='Sort order when sort_by is set.')
    top_n: int | None = Field(default=None, ge=1, le=MAX_GROUP_ROWS, description='Return at most this many groups (max 200).')


@agents.tool(
    name='group_by_aggregate',
    description=(
        'Group the loaded CSV by one or more columns and compute aggregates (sum, mean, median, min, '
        'max, count, nunique, std) per group. Optional filters apply before grouping. Output columns '
        "are named '<column>__<function>'; 'row_count' is always included. Returns at most 200 groups."
    ),
    input_schema=GroupByInput,
    model_access='direct',
    annotations=agents.ToolAnnotations(read_only_hint=True),
)
def group_by_aggregate(ctx: agents.ToolCallbackContext, /, args: GroupByInput) -> dict[str, Any]:
    _, df = _require_df(ctx)
    for column in args.group_by:
        _require_column(df, column)
    for aggregation in args.aggregations:
        _require_column(df, aggregation.column)
    data = df
    if args.filters:
        data = data[_combine_filters(data, args.filters, 'and')]
    if data.empty:
        raise agents.ToolError('The filters matched 0 rows, so there is nothing to group.')
    named = {f'{aggregation.column}__{aggregation.function}': (aggregation.column, aggregation.function) for aggregation in args.aggregations}
    grouped = data.groupby(args.group_by, dropna=False).agg(**named)
    grouped['row_count'] = data.groupby(args.group_by, dropna=False).size()
    result = grouped.reset_index()
    if args.sort_by is not None:
        if args.sort_by not in result.columns:
            raise agents.ToolError(f'sort_by {args.sort_by!r} is not an output column. Available: {[str(c) for c in result.columns]}')
        result = result.sort_values(args.sort_by, ascending=args.ascending)
    total_groups = int(len(result))
    result = result.head(args.top_n or MAX_GROUP_ROWS)
    return {
        'matched_rows': int(len(data)),
        'total_groups': total_groups,
        'returned_groups': int(len(result)),
        'columns': [str(c) for c in result.columns],
        'rows': _records(result),
    }


INSTRUCTIONS = """You are a conversational data analyst. The user chats with you and shares a link to a CSV
file in their Google Drive. Your job is to load that file and answer plain-language questions
about it with real numbers computed from the data.

Capabilities:
- The google_drive_mcp connector (its tools are prefixed google_drive_mcp.) reads the USER's own Google Drive as the user. Use it to resolve links and download files.
- Fixed analysis tools: load_csv, dataset_info, describe_columns, preview_rows, filter_rows,
  group_by_aggregate. These are the ONLY way you compute on the data. Never write or run code
  and never use a shell: no arbitrary code execution.

Workflow when the user shares a Google Drive link (or a file name) to a CSV:
1. Extract the file ID from the link (patterns: https://drive.google.com/file/d/<ID>/view...,
   /d/<ID>/, ?id=<ID>, or a bare ID). If there is no ID in the link, call google_drive_mcp
   search_files, e.g. query "title contains '<name>' and mimeType contains 'csv'", to find the ID.
2. Call google_drive_mcp get_file_metadata with the file ID to confirm the file and get its
   title. If the metadata says the file is larger than about 8 MB, warn the user that only
   small-to-medium CSVs are supported before downloading.
3. Call google_drive_mcp download_file_content with the file ID. It returns the file content base64-encoded in the field "content".
4. Call load_csv exactly once with drive_url_or_file_id set to the link or ID the user gave, file_name set to the title, and csv_base64 set to the exact base64 string from the download result.
5. Call dataset_info and describe_columns (and preview_rows when it helps) to understand the data.

Answering questions:
- Ground every number in tool results. Never invent, estimate, or round numbers silently. If a fact is not in the data, say so.
- Use describe_columns for schema/data-quality questions, preview_rows to inspect records,
  filter_rows for row-level questions (how many rows match, show matching rows), and
  group_by_aggregate for group-by questions (average X by Y). Chain tools when a question
  needs it: filter first, then group (group_by_aggregate accepts filters).
- Follow-ups: this conversation keeps its full history, and the loaded CSV stays in this
  session's workspace. Call dataset_info to recall which file is loaded when the user says
  "the file" or "it". If the user shares a NEW link, call load_csv again; it replaces the
  loaded file for this session.
- If a tool returns an error, read it and fix the call (for example a wrong column name: dataset_info lists the exact columns). Never guess column names.
- Reply in the same language the user writes in (default: Traditional Chinese). Be concise:
  lead with the answer and the real numbers, then one short line on how it was computed
  (which tool, filter, or grouping). Render small result sets as Markdown tables.
"""

agent = agents.Agent(
    model='mistral-large-4',
    name='omniesggo',
    description=('Conversational CSV data analyst: loads a CSV from your Google Drive via your Drive connection and answers plain-language questions with fixed, read-only analysis tools.'),
    instructions=INSTRUCTIONS,
    connectors=[agents.connector('google_drive_mcp')],
    tools=[load_csv, dataset_info, describe_columns, preview_rows, filter_rows, group_by_aggregate],
    max_iterations=30,
)
