const PDFDocument = require("pdfkit");
const path = require("path");

const formatCurrency = (value) =>
    Number(value || 0).toLocaleString("id-ID");

exports.generatePurchaseReturnPdf = (
    purchaseReturn,
    res
) => {

    const doc = new PDFDocument({
        margin: 50,
        size: "A4",
    });

    const logoPath = path.join(
        process.cwd(),
        "src",
        "modules",
        "assets",
        "logo.png"
    );

    res.setHeader(
        "Content-Type",
        "application/pdf"
    );

    res.setHeader(
        "Content-Disposition",
        `inline; filename=${purchaseReturn.returnNumber}.pdf`
    );

    doc.pipe(res);

    /* ========================= */
    /* HEADER */
    /* ========================= */

    try {

        doc.image(
            logoPath,
            50,
            45,
            {
                fit: [70, 70],
            }
        );

    } catch (err) {

        console.error(
            "Logo not found:",
            err.message
        );

    }

    doc
        .fontSize(20)
        .text(
            "PURCHASE RETURN",
            350,
            50,
            {
                align: "right",
            }
        );

    doc
        .fontSize(10)
        .text(
            `Return Number : ${purchaseReturn.returnNumber}`,
            {
                align: "right",
            }
        );

    doc
        .text(
            `Date : ${new Date(
                purchaseReturn.createdAt
            ).toLocaleDateString("id-ID")}`,
            {
                align: "right",
            }
        );

    doc.moveDown(3);

    /* ========================= */
    /* SUPPLIER INFO */
    /* ========================= */

    doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("Supplier Information");

    doc
        .font("Helvetica")
        .fontSize(10)
        .text(
            `Supplier : ${purchaseReturn.purchase?.supplier?.name ||
            "-"
            }`
        );

    doc.text(
        `Purchase Number : ${purchaseReturn.purchase
            ?.invoiceNumber || "-"
        }`
    );

    if (purchaseReturn.reason) {
        doc.text(
            `Notes : ${purchaseReturn.reason}`
        );
    }

    doc.moveDown();

    /* ========================= */
    /* TABLE HEADER */
    /* ========================= */

    const tableTop = doc.y + 10;

    doc
        .font("Helvetica-Bold")
        .fontSize(10);

    doc.text(
        "No",
        50,
        tableTop
    );

    doc.text(
        "Product",
        90,
        tableTop
    );

    doc.text(
        "Qty",
        300,
        tableTop,
        {
            width: 50,
            align: "center",
        }
    );

    doc.text(
        "Price",
        360,
        tableTop,
        {
            width: 80,
            align: "right",
        }
    );

    doc.text(
        "Subtotal",
        450,
        tableTop,
        {
            width: 100,
            align: "right",
        }
    );

    doc.moveTo(
        50,
        tableTop + 15
    )
        .lineTo(
            550,
            tableTop + 15
        )
        .stroke();

    /* ========================= */
    /* ITEMS */
    /* ========================= */

    let y =
        tableTop + 25;

    doc.font("Helvetica");

    purchaseReturn.items.forEach(
        (
            item,
            index
        ) => {

            const qty =
                item.qty ||
                item.quantity ||
                0;

            const price =
                item.purchaseItem?.costPrice || 0;

            const subtotal =
                item.purchaseItem?.subtotal ||
                qty * price;

            doc.text(
                String(index + 1),
                50,
                y
            );

            doc.text(
                item.purchaseItem.product?.name ||
                "-",
                90,
                y,
                {
                    width: 190,
                }
            );

            doc.text(
                String(qty),
                300,
                y,
                {
                    width: 50,
                    align: "center",
                }
            );

            doc.text(
                formatCurrency(
                    price
                ),
                360,
                y,
                {
                    width: 80,
                    align: "right",
                }
            );

            doc.text(
                formatCurrency(
                    subtotal
                ),
                450,
                y,
                {
                    width: 100,
                    align: "right",
                }
            );

            y += 25;

        }
    );

    const totalReturn =
        purchaseReturn.items?.reduce(

            (sum, item) =>

                sum +

                (
                    Number(item.quantity || 0) *
                    Number(
                        item.purchaseItem?.costPrice || 0
                    )
                ),

            0

        ) || 0;

    /* ========================= */
    /* TOTAL */
    /* ========================= */

    doc.moveTo(
        350,
        y + 10
    )
        .lineTo(
            550,
            y + 10
        )
        .stroke();

    doc
        .font(
            "Helvetica-Bold"
        )
        .text(
            "Total Return",
            350,
            y + 20,
            {
                width: 100,
            }
        );

    doc.text(
        `Rp ${formatCurrency(
            totalReturn
        )}`,
        430,
        y + 20,
        {
            width: 120,
            align: "right",
        }
    );

    /* ========================= */
    /* FOOTER */
    /* ========================= */

    doc
        .font(
            "Helvetica"
        )
        .fontSize(9)
        .text(
            "Generated automatically by system",
            50,
            760,
            {
                align: "center",
            }
        );

    doc.end();

};