const PDFDocument = require("pdfkit");
const path = require("path");
const fs = require("fs");

exports.generateSaleReturnPdf =
    (
        saleReturn,
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
            `attachment; filename=${saleReturn.returnNumber}.pdf`
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
                "SALE RETURN",
                0,
                55,
                {
                    align: "center",
                }
            );

        const boxY = 120;

        doc
            .roundedRect(
                50,
                boxY,
                500,
                90,
                5
            )
            .stroke();

        doc
            .fontSize(11)
            .font("Helvetica");

        doc.text(
            `Return Number : ${saleReturn.returnNumber}`,
            70,
            boxY + 15
        );

        doc.text(
            `Invoice Number : ${saleReturn.sale.invoiceNumber}`,
            70,
            boxY + 35
        );

        doc.text(
            `Date : ${new Date(
                saleReturn.createdAt
            ).toLocaleDateString("id-ID")}`,
            70,
            boxY + 55
        );

        doc.text(
            `Reason : ${saleReturn.reason || "-"}`,
            320,
            boxY + 15
        );

        /* ====================== */
        /* TABLE */
        /* ====================== */

        const tableTop = 260;

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

        doc.fillColor("black");

        doc.text(
            "Product",
            60,
            tableTop + 7
        );

        doc.text(
            "Returned Qty",
            430,
            tableTop + 7
        );

        let y =
            tableTop + 35;

        let totalQty = 0;

        saleReturn.items.forEach(
            (item) => {

                doc.text(
                    item.saleItem.product.name,
                    60,
                    y
                );

                doc.text(
                    String(
                        item.quantity
                    ),
                    450,
                    y
                );

                totalQty +=
                    item.quantity;

                y += 25;

            }
        );

        /* ====================== */
        /* TOTAL */
        /* ====================== */

        y += 20;

        doc
            .roundedRect(
                330,
                y,
                220,
                55,
                5
            )
            .stroke();

        doc.text(
            "Total Return Qty",
            350,
            y + 10
        );

        doc
            .fontSize(18)
            .font("Helvetica-Bold")
            .text(
                String(totalQty),
                350,
                y + 25
            );

        doc.end();

    };