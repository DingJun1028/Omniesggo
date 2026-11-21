const ERROR_CODES = {
  INVALID_PARAMS: {
    code: 'ERR_INVALID_PARAMS',
    message: '無效的請求參數',
    httpStatus: 400,
  },
  UNAUTHORIZED: {
    code: 'ERR_UNAUTHORIZED',
    message: '未授權存取',
    httpStatus: 401,
  },
  FORBIDDEN: {
    code: 'ERR_FORBIDDEN',
    message: '禁止存取',
    httpStatus: 403,
  },
  NOT_FOUND: {
    code: 'ERR_NOT_FOUND',
    message: '資源不存在',
    httpStatus: 404,
  },
  SKILL_NOT_FOUND: {
    code: 'ERR_SKILL_NOT_FOUND',
    message: '技能不存在',
    httpStatus: 404,
  },
  TASK_REQUIRED: {
    code: 'ERR_TASK_REQUIRED',
    message: 'task.id 和 task.taskType 為必填',
    httpStatus: 400,
  },
  FAILURE_REASON_REQUIRED: {
    code: 'ERR_FAILURE_REASON_REQUIRED',
    message: 'failureReason 為必填',
    httpStatus: 400,
  },
  EVENT_REQUIRED: {
    code: 'ERR_EVENT_REQUIRED',
    message: 'event body 為必填',
    httpStatus: 400,
  },
  BRIDGE_FAILURE: {
    code: 'ERR_BRIDGE_FAILURE',
    message: '橋接服務失敗',
    httpStatus: 502,
  },
  BRIDGE_UNREACHABLE: {
    code: 'ERR_BRIDGE_UNREACHABLE',
    message: '橋接服務不可達',
    httpStatus: 502,
  },
  INTERNAL_ERROR: {
    code: 'ERR_INTERNAL',
    message: '內部伺服器錯誤',
    httpStatus: 500,
  },
};

function jsonError(res, key, customMessage) {
  const error = ERROR_CODES[key];
  return res.status(error.httpStatus).json({
    success: false,
    error: customMessage || error.message,
    code: error.code,
  });
}

function jsonSuccess(res, data, message) {
  return res.json({ success: true, message, data });
}

module.exports = { ERROR_CODES, jsonError, jsonSuccess };