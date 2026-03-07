import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';

export const sanitizeInput = (req, res, next) => {
    req.body = mongoSanitize(req.body);
    req.body = xss(req.body);
    next();
};