const PDFDocument = require("pdfkit");
const path = require("path");
const fs = require("fs");

const formatCurrency = (value) =>
    Number(value).toLocaleString("id-ID");

exports.generatePurchasePdf = (purchase, res) => {

    const logoPath = path.resolve("src/assets/logo.png");

    const doc = new PDFDocument({ margin: 50 });

    doc.pipe(res);

    /* ========================= */
    /* LOGO */
    /* ========================= */
    if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 50, 40, { width: 80 });
    } else {
        console.log("Logo file tidak ditemukan di:", logoPath);
    }
    // try {
    //     doc.image(logoPath, 50, 40, {
    //         width: 80,
    //     });
    // } catch (err) {
    //     console.log("Logo not found:", err.message);
    // }

    /* ========================= */
    /* HEADER */
    /* ========================= */
    doc
        .fontSize(18)
        .font("Helvetica-Bold")
        .text("PURCHASE INVOICE", { align: "center" });

    doc.moveDown(2);

    /* ========================= */
    /* INVOICE BOX */
    /* ========================= */
    const boxTop = doc.y;

    doc
        .rect(50, boxTop, 300, 60)
        .stroke();

    doc
        .fontSize(10)
        .font("Helvetica")
        .text(`Invoice No : ${purchase.invoiceNumber}`, 60, boxTop + 10)
        .text(`Date : ${purchase.date}`, 60, boxTop + 25)
        .text(`Supplier : ${purchase.supplier?.name}`, 60, boxTop + 40);

    doc.moveDown(4);

    /* ========================= */
    /* TABLE HEADER */
    /* ========================= */
    const tableTop = doc.y;

    doc
        .fontSize(10)
        .font("Helvetica-Bold");

    doc.text("Product", 50, tableTop);
    doc.text("Qty", 280, tableTop);
    doc.text("Price", 340, tableTop);
    doc.text("Total", 450, tableTop);

    doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

    /* ========================= */
    /* TABLE ROW */
    /* ========================= */
    let y = tableTop + 25;

    doc.font("Helvetica");

    purchase.items.forEach((item) => {
        const total = item.qty * item.price;

        doc.text(item.product.name, 50, y);
        doc.text(item.quantity, 280, y);
        doc.text(formatCurrency(item.costPrice), 340, y);
        doc.text(formatCurrency(item.subtotal), 450, y);

        y += 20;
    });

    doc.moveTo(50, y + 5).lineTo(550, y + 5).stroke();

    /* ========================= */
    /* SUMMARY */
    /* ========================= */
    const summaryY = y + 20;

    doc.font("Helvetica");

    doc.text("Subtotal", 350, summaryY);
    doc.text(`Rp ${formatCurrency(purchase.subtotal)}`, 450, summaryY);

    doc.text(`Discount (${purchase.discount}%)`, 350, summaryY + 15);
    doc.text(`Rp ${formatCurrency(purchase.discountAmount)}`, 450, summaryY + 15);

    doc.text(`Tax (${purchase.tax}%)`, 350, summaryY + 30);
    doc.text(`Rp ${formatCurrency(purchase.taxAmount)}`, 450, summaryY + 30);

    /* garis pemisah */
    doc
        .moveTo(350, summaryY + 50)
        .lineTo(550, summaryY + 50)
        .stroke();

    /* GRAND TOTAL */
    doc
        .font("Helvetica-Bold")
        .fontSize(12)
        .text("GRAND TOTAL", 350, summaryY + 60);

    doc.text(
        `Rp ${formatCurrency(purchase.totalAmount)}`,
        450,
        summaryY + 60
    );

    /* ========================= */
    /* FOOTER */
    /* ========================= */
    doc
        .fontSize(10)
        .font("Helvetica")
        .text("Prepared By", 0, 700, { align: "center" });

    doc
        .moveTo(250, 715)
        .lineTo(350, 715)
        .stroke();

    doc.text("Inventory System", 0, 725, { align: "center" });

    doc.end();
};