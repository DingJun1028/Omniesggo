"""Offline unit tests for the fixed analysis tools (no API key needed)."""

import base64

import main
from mistralai import agents


def make_ctx(session_id: str) -> agents.ToolCallbackContext:
    return agents.ToolCallbackContext(agents.CallbackSession(id=session_id, turn_id='t-1'), tool_call_id='c-1')


SALES_CSV = 'region,product,units,price\nNorth,A,10,9.5\nNorth,B,5,20\nSouth,A,7,9.5\nSouth,B,3,20\nEast,A,0,9.5\n'
SALES_B64 = base64.b64encode(SALES_CSV.encode('utf-8')).decode('ascii')

# The real CSV found in the user's Google Drive (95 bytes).
DRIVE_B64 = 'cHJvamVjdF9udW1iZXIscHJvamVjdF9pZCxwcm9qZWN0X25hbWUscHJvcG9zZWRfbGltaXQNCjkwMzc3MDUxMjIxOSxxdWFucWtleSxKdW5BaUtleSwyMDAgVGlCDQo='
DRIVE_LINK = 'https://drive.google.com/file/d/1l5hv9ixxyTGnUN6JOPlNG8605zgqmZ51/view?usp=drivesdk'


def expect_tool_error(fn, *args, **kwargs) -> None:
    try:
        fn(*args, **kwargs)
    except agents.ToolError:
        return
    raise AssertionError(f'expected agents.ToolError from {fn}')


def test_extract_file_id() -> None:
    fid = '1AbCdEfGhIjKlMnOpQrStUvWxYz0123456789'
    assert main.extract_file_id(f'https://drive.google.com/file/d/{fid}/view?usp=sharing') == fid
    assert main.extract_file_id(f'https://drive.google.com/open?id={fid}') == fid
    assert main.extract_file_id(f'https://drive.google.com/uc?export=download&id={fid}') == fid
    assert main.extract_file_id(fid) == fid
    assert main.extract_file_id('not a link at all') is None
    print('ok: extract_file_id')


def test_load_and_describe() -> None:
    ctx = make_ctx('s-load')
    result = main.load_csv(
        ctx,
        main.LoadCsvInput(
            drive_url_or_file_id='https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQrStUvWxYz0123456789/view',
            csv_base64=SALES_B64,
            file_name='sales.csv',
        ),
    )
    assert result['rows'] == 5, result
    assert result['columns'] == ['region', 'product', 'units', 'price'], result
    assert result['file_name'] == 'sales.csv'
    assert len(result['preview']) == 5

    info = main.dataset_info(ctx)
    assert info['rows'] == 5 and info['file_id'] == '1AbCdEfGhIjKlMnOpQrStUvWxYz0123456789'

    described = main.describe_columns(ctx, main.DescribeColumnsInput())
    units = described['columns']['units']
    assert units['mean'] == 5.0 and units['min'] == 0.0 and units['max'] == 10.0, units
    region = described['columns']['region']
    assert region['distinct_count'] == 3 and region['top_values']['North'] == 2, region
    print('ok: load_csv / dataset_info / describe_columns')


def test_preview() -> None:
    ctx = make_ctx('s-preview')
    main.load_csv(
        ctx,
        main.LoadCsvInput(
            drive_url_or_file_id='1AbCdEfGhIjKlMnOpQrStUvWxYz0123456789',
            csv_base64=SALES_B64,
        ),
    )
    out = main.preview_rows(ctx, main.PreviewRowsInput(n=2, offset=3))
    assert out['returned'] == 2 and out['rows'][0]['region'] == 'South', out
    print('ok: preview_rows')


def test_filters() -> None:
    ctx = make_ctx('s-filter')
    main.load_csv(
        ctx,
        main.LoadCsvInput(
            drive_url_or_file_id='1AbCdEfGhIjKlMnOpQrStUvWxYz0123456789',
            csv_base64=SALES_B64,
        ),
    )
    north = main.filter_rows(
        ctx,
        main.FilterRowsInput(filters=[main.FilterCondition(column='region', op='eq', value='north')]),
    )
    assert north['matched_rows'] == 2, north

    big = main.filter_rows(
        ctx,
        main.FilterRowsInput(filters=[main.FilterCondition(column='units', op='gt', value=5)]),
    )
    assert big['matched_rows'] == 2, big

    combined = main.filter_rows(
        ctx,
        main.FilterRowsInput(
            filters=[
                main.FilterCondition(column='product', op='eq', value='A'),
                main.FilterCondition(column='units', op='gte', value=7),
            ],
            logic='and',
        ),
    )
    assert combined['matched_rows'] == 2, combined

    contained = main.filter_rows(
        ctx,
        main.FilterRowsInput(filters=[main.FilterCondition(column='region', op='contains', value='o')]),
    )
    assert contained['matched_rows'] == 4, contained

    in_list = main.filter_rows(
        ctx,
        main.FilterRowsInput(filters=[main.FilterCondition(column='region', op='isin', value=['North', 'East'])]),
    )
    assert in_list['matched_rows'] == 3, in_list

    expect_tool_error(
        main.filter_rows,
        ctx,
        main.FilterRowsInput(filters=[main.FilterCondition(column='nope', op='eq', value='x')]),
    )
    expect_tool_error(
        main.filter_rows,
        ctx,
        main.FilterRowsInput(filters=[main.FilterCondition(column='units', op='eq', value='abc')]),
    )
    print('ok: filter_rows')


def test_group_by() -> None:
    ctx = make_ctx('s-group')
    main.load_csv(
        ctx,
        main.LoadCsvInput(
            drive_url_or_file_id='1AbCdEfGhIjKlMnOpQrStUvWxYz0123456789',
            csv_base64=SALES_B64,
        ),
    )
    out = main.group_by_aggregate(
        ctx,
        main.GroupByInput(
            group_by=['region'],
            aggregations=[
                main.Aggregation(column='units', function='sum'),
                main.Aggregation(column='price', function='mean'),
                main.Aggregation(column='product', function='nunique'),
            ],
            sort_by='units__sum',
        ),
    )
    rows = {row['region']: row for row in out['rows']}
    assert out['total_groups'] == 3
    assert rows['North']['units__sum'] == 15
    assert rows['South']['units__sum'] == 10
    assert rows['East']['units__sum'] == 0
    assert rows['North']['row_count'] == 2
    assert rows['North']['product__nunique'] == 2
    assert abs(rows['North']['price__mean'] - 14.75) < 1e-9, rows['North']
    assert out['rows'][0]['region'] == 'North', out['rows']

    filtered = main.group_by_aggregate(
        ctx,
        main.GroupByInput(
            group_by=['product'],
            aggregations=[main.Aggregation(column='units', function='sum')],
            filters=[main.FilterCondition(column='region', op='isin', value=['North', 'South'])],
        ),
    )
    rows = {row['product']: row for row in filtered['rows']}
    assert filtered['matched_rows'] == 4
    assert rows['A']['units__sum'] == 17 and rows['B']['units__sum'] == 8, rows

    expect_tool_error(
        main.group_by_aggregate,
        ctx,
        main.GroupByInput(
            group_by=['region'],
            aggregations=[main.Aggregation(column='units', function='sum')],
            filters=[main.FilterCondition(column='units', op='gt', value=100)],
        ),
    )
    print('ok: group_by_aggregate')


def test_session_isolation_and_errors() -> None:
    empty_ctx = make_ctx('s-empty')
    expect_tool_error(main.dataset_info, empty_ctx)
    expect_tool_error(
        main.filter_rows,
        empty_ctx,
        main.FilterRowsInput(filters=[main.FilterCondition(column='a', op='eq', value='b')]),
    )

    loaded_ctx = make_ctx('s-loaded')
    main.load_csv(
        loaded_ctx,
        main.LoadCsvInput(
            drive_url_or_file_id='1AbCdEfGhIjKlMnOpQrStUvWxYz0123456789',
            csv_base64=SALES_B64,
        ),
    )
    expect_tool_error(main.dataset_info, make_ctx('s-other'))
    expect_tool_error(
        main.load_csv,
        make_ctx('s-bad'),
        main.LoadCsvInput(drive_url_or_file_id='no id here', csv_base64=SALES_B64),
    )
    expect_tool_error(
        main.load_csv,
        make_ctx('s-bad2'),
        main.LoadCsvInput(drive_url_or_file_id='1AbCdEfGhIjKlMnOpQrStUvWxYz0123456789', csv_base64='!!!not-base64!!!'),
    )
    print('ok: session isolation and error paths')


def test_real_drive_csv() -> None:
    ctx = make_ctx('s-drive')
    result = main.load_csv(
        ctx,
        main.LoadCsvInput(
            drive_url_or_file_id=DRIVE_LINK,
            csv_base64=DRIVE_B64,
            file_name='437aadc2-61d0-11f0-a3da-747446fac1d0.csv',
        ),
    )
    assert result['file_id'] == '1l5hv9ixxyTGnUN6JOPlNG8605zgqmZ51'
    assert result['rows'] == 1
    assert result['columns'] == ['project_number', 'project_id', 'project_name', 'proposed_limit']
    assert result['preview'][0]['project_name'] == 'JunAiKey'
    print('ok: real Drive CSV loads and parses')


if __name__ == '__main__':
    test_extract_file_id()
    test_load_and_describe()
    test_preview()
    test_filters()
    test_group_by()
    test_session_isolation_and_errors()
    test_real_drive_csv()
    print('ALL TESTS PASSED')
