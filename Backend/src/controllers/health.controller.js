const getHealth = (req, res) => {
  res.json({
    success: true,
    message: 'CartCraft API is running',
  });
};

module.exports = { getHealth };
