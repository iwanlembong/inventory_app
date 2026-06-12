const PDFDocument = require("pdfkit");
const path = require("path");
const fs = require("fs");

const formatCurrency = (value) =>
    Number(value || 0).toLocaleString("id-ID");

const safe = (v) => (v ? v : 0);
const safeText = (v) => (v ? v : "-");


const formatDate = (date) => {

    if (!date) return "-";

    return new Intl.DateTimeFormat(
        "en-GB",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
        }
    ).format(
        new Date(date)
    );
};

exports.generateProfitPdf = (data, res) => {
    const {
        company = {},
        period = {},
        summary = {},
        items = [],
    } = data;

    const doc = new PDFDocument({
        margin: 40,
        size: "A4",
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
        "Content-Disposition",
        "inline; filename=profit-report.pdf"
    );

    doc.pipe(res);

    /* ================= LOGO ================= */
    const logoPath = path.join(
        __dirname,
        "../../assets/logo.png"
    );

    if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 40, 30, { width: 55 });
    }

    /* ================= HEADER ================= */
    doc.fontSize(16).font("Helvetica-Bold").text(
        company.name || "PROFIT REPORT",
        110,
        35
    );

    doc.fontSize(9).font("Helvetica").text(
        company.address || "",
        110,
        55
    );

    doc.text(company.phone || "", 110, 70);

    doc.fontSize(10).font("Helvetica-Bold").text(
        `PERIOD: ${safeText(formatDate(period.start))} - ${safeText(formatDate(period.end))}`,
        380,
        35,
        { align: "right", width: 170 }
    );

    doc.moveTo(40, 95).lineTo(555, 95).stroke();

    /* ================= SUMMARY BOX ================= */
    const boxY = 110;

    doc.rect(40, boxY, 515, 80).stroke();

    const summaryItems = [

        {
            label: "Total Sales",
            value: summary.totalSales,
        },

        {
            label: "Total Cost",
            value: summary.totalCost,
        },

        {
            label: "Gross Profit",
            value: summary.grossProfit,
        },

        {
            label: "Total Expense",
            value: summary.totalExpense,
        },

        {
            label: "Net Profit",
            value: summary.netProfit,
        },

    ];

    const colWidth = 103;

    summaryItems.forEach(
        (item, index) => {

            const x =
                50 +
                (index * colWidth);

            doc
                .fontSize(9)
                .font("Helvetica")
                .text(
                    item.label,
                    x,
                    boxY + 15,
                    {
                        width: 90,
                        align: "center",
                    }
                );

            doc
                .fontSize(11)
                .font("Helvetica-Bold")
                .text(
                    formatCurrency(
                        item.value
                    ),
                    x,
                    boxY + 40,
                    {
                        width: 90,
                        align: "center",
                    }
                );

        }
    );

    /* ================= TABLE HEADER ================= */
    let y = boxY + 110;

    const x = {
        date: 40,
        desc: 110,
        sales: 310,
        cost: 400,
        profit: 485,
    };

    doc.fontSize(10).font("Helvetica-Bold");

    doc.text("Date", x.date, y);
    doc.text("Description", x.desc, y);
    doc.text("Sales", x.sales, y, { width: 80, align: "right" });
    doc.text("Cost", x.cost, y, { width: 80, align: "right" });
    doc.text("Profit", x.profit, y, { width: 80, align: "right" });

    doc.moveTo(40, y + 15).lineTo(555, y + 15).stroke();

    y += 25;

    /* ================= TABLE ROWS ================= */
    doc.font("Helvetica").fontSize(9);

    items.forEach((item) => {
        const sales = safe(item.sales);
        const cost = safe(item.cost ?? item.purchaseCost ?? item.cogs); // 🔥 FIX
        const profit = sales - cost;

        doc.text(safeText(formatDate(item.date)), x.date, y);
        doc.text(safeText(item.description), x.desc, y, { width: 180 });
        doc.text(formatCurrency(sales), x.sales, y, {
            width: 80,
            align: "right",
        });
        doc.text(formatCurrency(cost), x.cost, y, {
            width: 80,
            align: "right",
        });
        doc.text(formatCurrency(profit), x.profit, y, {
            width: 80,
            align: "right",
        });

        y += 18;

        if (y > 750) {
            doc.addPage();
            y = 50;
        }
    });

    /* ================= FOOTER SUMMARY ================= */
    y += 20;
    doc.moveTo(40, y).lineTo(555, y).stroke();

    y += 15;

    doc.font("Helvetica-Bold").fontSize(11).text("FINAL SUMMARY", 40, y);

    y += 20;

    doc.font("Helvetica").fontSize(10);

    doc.text(
        `Total Sales: ${formatCurrency(summary.totalSales)}`,
        40,
        y
    );

    doc.text(
        `Total Cost: ${formatCurrency(
            summary.totalCost
        )}`,
        40,
        y + 15
    );

    doc.text(
        `Gross Profit: ${formatCurrency(
            summary.grossProfit
        )}`,
        40,
        y + 30
    );

    doc.text(
        `Total Expense: ${formatCurrency(
            summary.totalExpense
        )}`,
        40,
        y + 45
    );

    doc.font("Helvetica-Bold");

    doc.text(
        `Net Profit: ${formatCurrency(
            summary.netProfit
        )}`,
        40,
        y + 60
    );

    doc.font("Helvetica");

    /* ================= FOOTER ================= */
    doc.fontSize(9).fillColor("gray").text(
        "Generated automatically by system",
        40,
        780,
        { align: "center", width: 515 }
    );

    doc.end();
};