const developmentApi = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

export const API = process.env.NODE_ENV === "development" ? developmentApi : "/api";
