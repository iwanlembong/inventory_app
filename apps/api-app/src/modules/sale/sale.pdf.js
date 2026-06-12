const PDFDocument = require("pdfkit");
const path = require("path");
const fs = require("fs");

const formatCurrency = (value) =>
    Number(value || 0).toLocaleString(
        "id-ID"
    );

exports.generateSalePdf =
    (
        sale,
        res
    ) => {

        const doc =
            new PDFDocument({
                margin: 50,
                size: "A4",
            });

        res.setHeader(
            "Content-Type",
            "application/pdf"
        );

        res.setHeader(
            "Content-Disposition",
            `attachment; filename=${sale.invoiceNumber}.pdf`
        );

        doc.pipe(res);

        /* ====================== */
        /* LOGO */
        /* ====================== */

        const logoPath =
            path.join(
                __dirname,
                "../../assets/logo.png"
            );

        if (
            fs.existsSync(
                logoPath
            )
        ) {

            doc.image(
                logoPath,
                50,
                40,
                {
                    width: 90,
                }
            );

        }

        /* ====================== */
        /* TITLE */
        /* ====================== */

        doc
            .fontSize(24)
            .font("Helvetica-Bold")
            .text(
                "SALES INVOICE",
                0,
                55,
                {
                    align: "center",
                }
            );

        doc.moveDown(2);

        /* ====================== */
        /* INVOICE BOX */
        /* ====================== */

        /* ====================== */
        /* INVOICE BOX */
        /* ====================== */

        const boxY = 120;

        doc
            .roundedRect(50, boxY, 500, 90, 5)
            .stroke();

        doc.fontSize(11).font("Helvetica");

        // LEFT COLUMN
        doc.text(
            `Invoice Number : ${sale.invoiceNumber}`,
            70,
            boxY + 15
        );

        doc.text(
            `Customer : ${sale.customer?.name || "Walk-in Customer"}`,
            70,
            boxY + 35
        );

        doc.text(
            `Phone : ${sale.customer?.phone || "-"}`,
            70,
            boxY + 55
        );

        // RIGHT COLUMN
        doc.text(
            `Date : ${new Date(sale.createdAt).toLocaleDateString("id-ID", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
            })}`,
            320,
            boxY + 15
        );

        doc.text(
            `Status : ${sale.status}`,
            320,
            boxY + 35
        );

        /* ====================== */
        /* TABLE HEADER */
        /* ====================== */

        const tableTop = 230;

        doc
            .rect(
                50,
                tableTop,
                500,
                25
            )
            .fillAndStroke(
                "#EAEAEA",
                "#CCCCCC"
            );

        doc
            .fillColor("black")
            .font("Helvetica-Bold")
            .fontSize(11);

        doc.text(
            "Product",
            60,
            tableTop + 7
        );

        doc.text(
            "Qty",
            300,
            tableTop + 7
        );

        doc.text(
            "Price",
            360,
            tableTop + 7
        );

        doc.text(
            "Subtotal",
            460,
            tableTop + 7
        );

        /* ====================== */
        /* TABLE ROWS */
        /* ====================== */

        let y =
            tableTop + 35;

        doc.font(
            "Helvetica"
        );

        sale.items.forEach(
            (item) => {

                doc.text(
                    item.product?.name ||
                    "-",
                    60,
                    y
                );

                doc.text(
                    String(
                        item.quantity
                    ),
                    300,
                    y
                );

                doc.text(
                    `Rp ${formatCurrency(
                        item.sellingPrice
                    )}`,
                    360,
                    y
                );

                doc.text(
                    `Rp ${formatCurrency(
                        item.subtotal
                    )}`,
                    460,
                    y
                );

                y += 25;

                doc.moveTo(
                    50,
                    y + 5
                )
                    .lineTo(
                        550,
                        y + 5
                    )
                    .strokeColor(
                        "#EEEEEE"
                    )
                    .stroke();

            }
        );

        /* ====================== */
        /* TOTAL BOX */
        /* ====================== */

        y += 25;

        doc
            .roundedRect(
                330,
                y,
                220,
                55,
                5
            )
            .stroke();

        doc
            .fontSize(11)
            .font("Helvetica");

        doc.text(
            "Grand Total",
            350,
            y + 10
        );

        doc
            .fontSize(18)
            .font("Helvetica-Bold")
            .text(
                `Rp ${formatCurrency(
                    sale.totalAmount
                )}`,
                350,
                y + 25
            );

        /* ====================== */
        /* SIGNATURE */
        /* ====================== */

        const signY =
            y + 120;

        doc
            .fontSize(11)
            .font("Helvetica");

        doc.text(
            "Prepared By",
            70,
            signY
        );

        doc.text(
            "Approved By",
            420,
            signY
        );

        doc.moveTo(
            60,
            signY + 70
        )
            .lineTo(
                180,
                signY + 70
            )
            .stroke();

        doc.moveTo(
            400,
            signY + 70
        )
            .lineTo(
                520,
                signY + 70
            )
            .stroke();

        /* ====================== */
        /* FOOTER */
        /* ====================== */

        doc
            .fontSize(9)
            .fillColor("gray")
            .text(
                "Generated automatically by Inventory SaaS",
                50,
                760,
                {
                    align: "center",
                }
            );

        doc.end();

    };