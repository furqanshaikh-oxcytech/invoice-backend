
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client'); // Use PrismaClient, not just @prisma/client
const prisma = new PrismaClient();

exports.formDetails = [
  // Validate and sanitize inputs
  body('name').trim().isLength({ min: 4 }).withMessage('Name must be at least 4 characters long').escape(),
  body('email').isEmail().withMessage('Invalid email address').normalizeEmail(),
  body('serviceType').trim().isLength({ min: 4 }).withMessage('Service must be at least 4 characters long').escape(),
  

  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, serviceType, date } = req.body;

    

    try {
      const details = await prisma.detail.create({
        data: {
          name,
          email,
          serviceType,
          date: new Date(date), 
        },
      });
      res.status(200).json(details);
    } catch (error) {
      console.error('Error creating details:', { name, email, serviceType, date, error });
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
];
