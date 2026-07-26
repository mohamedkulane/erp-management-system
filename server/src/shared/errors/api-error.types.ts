export interface ApiErrorDetail {
  code: string;
  field: string;
  message: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: ApiErrorDetail[];
  };
  meta: {
    correlationId: string;
  };
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta: {
    correlationId: string;
  };
}
