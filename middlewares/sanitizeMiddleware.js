import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const { window } = new JSDOM('');
const purify = DOMPurify(window);

const sanitizeMiddleware = (req, res, next) => {
  const hasHtmlTags = /<[^>]*>/;

  if (req.body) {
    Object.keys(req.body).forEach((key) => {
      if (hasHtmlTags.test(req.body[key])) {
        return next(new Error(`HTML tags are not allowed in ${key}`));
      }
      req.body[key] = purify.sanitize(req.body[key], { ALLOWED_TAGS: [] });
    });
  }

  if (req.query) {
    Object.keys(req.query).forEach((key) => {
      if (hasHtmlTags.test(req.query[key])) {
        return next(new Error(`HTML tags are not allowed in ${key}`));
      }
      req.query[key] = purify.sanitize(req.query[key], { ALLOWED_TAGS: [] });
    });
  }

  if (req.cookies) {
    Object.keys(req.cookies).forEach((key) => {
      if (hasHtmlTags.test(req.cookies[key])) {
        return next(new Error(`HTML tags are not allowed in ${key}`));
      }
      req.cookies[key] = purify.sanitize(req.cookies[key], {
        ALLOWED_TAGS: [],
      });
    });
  }

  next();
};

export default sanitizeMiddleware;
