import axios from "axios";
import siteConfig from "../../config/siteConfig";

const adminApi = axios.create({
  baseURL: `${siteConfig.apiBaseUrl}/api/admin`,
  withCredentials: true, // send/receive the httpOnly admin_token cookie
});

export default adminApi;
