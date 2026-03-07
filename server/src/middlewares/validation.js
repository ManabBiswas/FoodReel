import {body, validationResult} from 'express-validator';

export const validateOrderCreation = [
  body('foodId').isMongoId(),
  body('deliveryAddress.phone').isMobilePhone(),
  body('deliveryAddress.pincode').isPostalCode('IN'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];
