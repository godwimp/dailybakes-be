export interface ApiResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
    error?: string;
}

export interface ErrorResponse {
    statusCode: number;
    message: string | string[];
    error: string;
    timestamp: string;
    path: string;
}