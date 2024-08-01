const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.formDetails = async (req, res) => {
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
};
