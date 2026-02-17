/**
 * PDF Receipt Generator for FoodReel Orders
 * Generates a professional PDF receipt with complete order details
 */

import { jsPDF } from "jspdf";

/**
 * Generate and download PDF receipt for an order
 * @param {Object} order - Complete order object
 */
export const generateReceipt = (order) => {
  try {
    // Create new PDF document
    const doc = new jsPDF();
    
    // Page dimensions
    const pageWidth = doc.internal.pageSize.width;
    const margin = 15;
    let yPos = 20;
    
    // Helper function to add centered text
    const addCenteredText = (text, y, fontSize = 12, fontStyle = 'normal') => {
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', fontStyle);
      const textWidth = doc.getTextWidth(text);
      const x = (pageWidth - textWidth) / 2;
      doc.text(text, x, y);
    };
    
    // Helper function to add line
    const addLine = (y) => {
      doc.setLineWidth(0.5);
      doc.line(margin, y, pageWidth - margin, y);
    };
    
    // ============= HEADER =============
    doc.setFillColor(234, 88, 12); // Orange color
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    addCenteredText('FOODREEL', 15, 50, 'bold');
    addCenteredText('Order Receipt', 25, 12, 'normal');
    addCenteredText('Food Discovery & Delivery Platform', 32, 10, 'normal');
    
    doc.setTextColor(0, 0, 0); // Reset to black
    yPos = 50;
    
    // ============= ORDER INFO =============
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`Order ID: ${order._id || 'N/A'}`, margin, yPos);
    
    yPos += 6;
    doc.setFont('helvetica', 'normal');
    doc.text(`Order Date: ${order.createdAt ? new Date(order.createdAt).toLocaleString('en-IN', { 
      dateStyle: 'medium', 
      timeStyle: 'short' 
    }) : 'N/A'}`, margin, yPos);
    
    yPos += 6;
    doc.text(`Status: ${(order.status || 'pending').toUpperCase()}`, margin, yPos);
    
    yPos += 6;
    doc.text(`Payment: ${(order.paymentDetails?.method || 'N/A').toUpperCase()} - ${(order.paymentDetails?.status || 'pending').toUpperCase()}`, margin, yPos);
    
    yPos += 10;
    addLine(yPos);
    yPos += 8;
    
    // ============= CUSTOMER INFO =============
    doc.setFont('helvetica', 'bold');
    doc.text('CUSTOMER DETAILS', margin, yPos);
    yPos += 6;
    
    doc.setFont('helvetica', 'normal');
    const customerName = order.user?.firstName 
      ? `${order.user.firstName} ${order.user.lastName || ''}`
      : order.deliveryAddress?.fullName || 'N/A';
    doc.text(`Name: ${customerName}`, margin, yPos);
    
    yPos += 6;
    if (order.user?.email) {
      doc.text(`Email: ${order.user.email}`, margin, yPos);
      yPos += 6;
    }
    
    const phone = order.deliveryAddress?.phone || order.user?.mobile || 'N/A';
    doc.text(`Phone: ${phone}`, margin, yPos);
    
    yPos += 10;
    addLine(yPos);
    yPos += 8;
    
    // ============= DELIVERY ADDRESS =============
    doc.setFont('helvetica', 'bold');
    doc.text('DELIVERY ADDRESS', margin, yPos);
    yPos += 6;
    
    doc.setFont('helvetica', 'normal');
    const addr = order.deliveryAddress || {};
    if (addr.addressLine1) {
      doc.text(addr.addressLine1, margin, yPos);
      yPos += 5;
    }
    if (addr.addressLine2) {
      doc.text(addr.addressLine2, margin, yPos);
      yPos += 5;
    }
    if (addr.landmark) {
      doc.text(`Landmark: ${addr.landmark}`, margin, yPos);
      yPos += 5;
    }
    doc.text(`${addr.city || ''}, ${addr.state || ''} - ${addr.pincode || ''}`, margin, yPos);
    
    yPos += 10;
    addLine(yPos);
    yPos += 8;
    
    // ============= ORDER ITEMS =============
    doc.setFont('helvetica', 'bold');
    doc.text('ORDER ITEMS', margin, yPos);
    yPos += 8;
    
    // Table header
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, yPos - 5, pageWidth - 2 * margin, 7, 'F');
    doc.setFontSize(9);
    doc.text('Item', margin + 2, yPos);
    doc.text('Qty', pageWidth - margin - 70, yPos);
    doc.text('Price', pageWidth - margin - 50, yPos);
    doc.text('Total', pageWidth - margin - 10, yPos, { align: 'right' });
    yPos += 8;
    
    // Items
    doc.setFont('helvetica', 'normal');
    const items = order.items || [];
    items.forEach((item) => {
      const itemName = item.foodItem?.name || item.name || 'Unknown Item';
      const qty = item.quantity || 1;
      const price = item.priceAtOrder || item.price || 0;
      const total = qty * price;
      
      // Check if we need a new page
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      
      // Item name (truncate if too long)
      const maxNameWidth = pageWidth - margin - 70;
      let displayName = itemName;
      if (doc.getTextWidth(displayName) > maxNameWidth) {
        while (doc.getTextWidth(displayName + '...') > maxNameWidth && displayName.length > 10) {
          displayName = displayName.slice(0, -1);
        }
        displayName += '...';
      }
      
      doc.text(displayName, margin + 2, yPos);
      doc.text(qty.toString(), pageWidth - margin - 70, yPos);
      doc.text(`Rs.${price.toFixed(2)}`, pageWidth - margin - 50, yPos);
      doc.text(`Rs.${total.toFixed(2)}`, pageWidth - margin - 10, yPos, { align: 'right' });
      yPos += 6;
    });
    
    yPos += 5;
    addLine(yPos);
    yPos += 8;
    
    // ============= PRICING BREAKDOWN =============
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    
    const pricing = order.pricing || {};
    const rightAlign = pageWidth - margin;
    
    doc.text('Item Total:', margin, yPos);
    doc.text(`Rs. ${(pricing.itemPrice || 0).toFixed(2)}`, rightAlign, yPos, { align: 'right' });
    yPos += 6;
    
    if (pricing.deliveryFee > 0) {
      doc.text('Delivery Fee:', margin, yPos);
      doc.text(`Rs. ${pricing.deliveryFee.toFixed(2)}`, rightAlign, yPos, { align: 'right' });
      yPos += 6;
    }
    
    if (pricing.platformFee > 0) {
      doc.text('Platform Fee:', margin, yPos);
      doc.text(`Rs. ${pricing.platformFee.toFixed(2)}`, rightAlign, yPos, { align: 'right' });
      yPos += 6;
    }
    
    const gst = pricing.taxes?.gst || pricing.gst || 0;
    if (gst > 0) {
      doc.text('GST (5%):', margin, yPos);
      doc.text(`Rs. ${gst.toFixed(2)}`, rightAlign, yPos, { align: 'right' });
      yPos += 6;
    }
    
    if (pricing.discount > 0) {
      doc.setTextColor(0, 128, 0);
      doc.text('Discount:', margin, yPos);
      doc.text(`- Rs. ${pricing.discount.toFixed(2)}`, rightAlign, yPos, { align: 'right' });
      doc.setTextColor(0, 0, 0);
      yPos += 6;
    }
    
    yPos += 2;
    addLine(yPos);
    yPos += 8;
    
    // Grand Total
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('TOTAL AMOUNT:', margin, yPos);
    doc.text(`Rs. ${(pricing.totalAmount || 0).toFixed(2)}`, rightAlign, yPos, { align: 'right' });
    
    yPos += 10;
    addLine(yPos);
    yPos += 10;
    
    // ============= FOOTER =============
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    
    if (yPos > 260) {
      doc.addPage();
      yPos = 20;
    }
    
    addCenteredText('Thank you for ordering with FoodReel!', yPos, 10, 'bold');
    yPos += 6;
    addCenteredText('For support, contact us at support@foodreel.com', yPos, 9, 'italic');
    yPos += 5;
    addCenteredText('FoodReel', yPos, 9, 'italic');
    
    // Add page numbers at bottom
    const pageCount = doc.internal.getNumberOfPages();
    doc.setFontSize(8);
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.text(
        `Page ${i} of ${pageCount}`, 
        pageWidth / 2, 
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
    }
    
    // Generate filename
    const orderDate = order.createdAt ? new Date(order.createdAt).toISOString().split('T')[0] : 'unknown';
    const filename = `FoodReel_Receipt_${orderDate}_${(order._id || 'order').slice(-8)}.pdf`;
    
    // Save the PDF
    doc.save(filename);
    
    return true;
  } catch (error) {
    console.error('Error generating receipt:', error);
    throw new Error('Failed to generate receipt. Please try again.');
  }
};

export default generateReceipt;