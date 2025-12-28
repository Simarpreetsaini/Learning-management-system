const PaidNote = require('../models/paidNotesModel');
const Order = require('../models/orderModel');

/**
 * Gets sales analytics for teacher
 * @param {string} teacherId 
 * @returns {Promise<Object>}
 */
const getTeacherAnalytics = async (teacherId) => {
  try {
    // Get all notes by teacher
    const notes = await PaidNote.find({ uploadedBy: teacherId });
    const noteIds = notes.map(note => note._id);

    // Get all orders for these notes
    const orders = await Order.find({ 
      noteId: { $in: noteIds },
      paymentStatus: 'Completed'
    });

    // Calculate stats
    const totalSales = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.price, 0);
    
    const monthlyStats = orders.reduce((acc, order) => {
      const monthYear = order.orderDate.toISOString().substring(0, 7);
      acc[monthYear] = (acc[monthYear] || 0) + order.price;
      return acc;
    }, {});

    // Get top performing notes
    const notePerformance = await Order.aggregate([
      { $match: { noteId: { $in: noteIds }, paymentStatus: 'Completed' } },
      { $group: { _id: '$noteId', count: { $sum: 1 }, revenue: { $sum: '$price' } } },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'paid_notes', localField: '_id', foreignField: '_id', as: 'note' } },
      { $unwind: '$note' },
      { $project: { title: '$note.title', salesCount: '$count', revenue: 1 } }
    ]);

    return {
      totalSales,
      totalRevenue,
      monthlyStats,
      topNotes: notePerformance
    };
  } catch (error) {
    console.error('Analytics error:', error);
    throw new Error('Failed to generate analytics');
  }
};

module.exports = {
  getTeacherAnalytics
};
