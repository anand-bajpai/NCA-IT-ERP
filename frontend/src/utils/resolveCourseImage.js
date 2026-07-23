import siteConfig from "../config/siteConfig";

// Courses coming from the database store their image as a relative
// "/uploads/courses/xxx" path, which needs the API base URL prefixed.
// Courses from the static fallback catalog already have a fully-resolved
// (bundler-imported) image URL, so those pass through unchanged.
export function resolveCourseImage(image) {
  if (!image) return "";
  return image.startsWith("/uploads") ? `${siteConfig.apiBaseUrl}${image}` : image;
}

export default resolveCourseImage;
