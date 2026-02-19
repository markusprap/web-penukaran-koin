import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface TransactionData {
    id: string;
    storeName: string;
    storeCode: string;
    storeAddress?: string; // Optional, might not be in older records
    storeTeamName: string;
    storeTeamPosition: string;
    storeTeamWa: string;
    storeTeamNik?: string;
    vehicle: string;
    coins: { denom: number; qty: number }[];
    bigMoney: { denom: number; qty: number }[];
    timestamp: string;
    status: string;
    signature?: string | null;
    adminSignature?: string | null; // Finance Signature
    evidencePhoto?: string | null;
    userName: string; // Petugas Name
}

// Helper to generate dummy signature if missing (Client-side only)
const createDummySignature = (text: string) => {
    if (typeof window === 'undefined') return '';
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 150;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // Draw scribble
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(50, 75);
    ctx.bezierCurveTo(70, 20, 150, 20, 120, 75);
    ctx.bezierCurveTo(90, 130, 200, 130, 250, 75);
    ctx.stroke();

    // Add name text slightly
    ctx.font = '20px sans-serif';
    ctx.fillStyle = '#666666';
    ctx.fillText(text.substring(0, 15), 60, 120);

    return canvas.toDataURL('image/png');
};

export const generatePDF = (tx: TransactionData) => {
    // Calculate dynamic height based on content
    const baseHeight = 180; // Header, Meta, Signatures, Spacing
    const itemHeight = 7; // Approx height per row in table
    const coinRows = tx.coins.filter(c => c.qty > 0).length;
    const moneyRows = tx.bigMoney.filter(m => m.qty > 0).length;
    const dynamicHeight = baseHeight + (coinRows * itemHeight) + (moneyRows * itemHeight);

    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [80, dynamicHeight] // Dynamic height
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const centerX = pageWidth / 2;
    const marginX = 5;
    let cursorY = 10;

    // -- Helper functions --
    const centerText = (text: string, size: number = 10, isBold: boolean = false) => {
        doc.setFontSize(size);
        doc.setFont("helvetica", isBold ? "bold" : "normal");
        doc.text(text, centerX, cursorY, { align: "center" });
        cursorY += size * 0.5; // Spacing adjustment
    };

    const leftRightText = (left: string, right: string, size: number = 8, isBold: boolean = false) => {
        doc.setFontSize(size);
        doc.setFont("helvetica", isBold ? "bold" : "normal");
        doc.text(left, marginX, cursorY);
        doc.text(right, pageWidth - marginX, cursorY, { align: "right" });
        cursorY += size * 0.5;
    };

    const dashedLine = () => {
        (doc as any).setLineDash([1, 1], 0);
        doc.line(marginX, cursorY, pageWidth - marginX, cursorY);
        (doc as any).setLineDash([], 0); // Reset
        cursorY += 5;
    };

    // -- Header --
    centerText("INDOMARET", 14, true);
    cursorY += 2;
    centerText("BUKTI PENUKARAN KOIN", 10, true);

    cursorY += 3;
    dashedLine();

    // -- Metadata --
    // Date
    leftRightText("TANGGAL", format(new Date(tx.timestamp), 'dd/MM/yyyy HH:mm'), 8, true);
    cursorY += 2;

    // Store
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("TOKO", marginX, cursorY);
    // Multi-line text for store name if long
    const storeText = doc.splitTextToSize(`${tx.storeCode} - ${tx.storeName}`, 45);
    doc.text(storeText, pageWidth - marginX, cursorY, { align: "right" });
    cursorY += (storeText.length * 3) + 1; // Adjust cursor based on lines

    // Address (Optional)
    if (tx.storeAddress) {
        doc.setFontSize(6);
        doc.setFont("helvetica", "normal");
        doc.text("ALAMAT", marginX, cursorY);
        const addrText = doc.splitTextToSize(tx.storeAddress, 45);
        doc.text(addrText, pageWidth - marginX, cursorY, { align: "right" });
        cursorY += (addrText.length * 3) + 2;
    }

    dashedLine();

    // PIC Information
    leftRightText("PIC TOKO", tx.storeTeamName, 8, true);
    cursorY += 3;
    leftRightText("JABATAN", tx.storeTeamPosition, 8, true);
    cursorY += 3;
    leftRightText("NO WA", tx.storeTeamWa, 8, true);
    cursorY += 3;

    dashedLine();

    // Officer Info
    leftRightText("PETUGAS", tx.userName, 8, true);
    cursorY += 3;
    leftRightText("KENDARAAN", tx.vehicle, 8, true);

    cursorY += 4;
    dashedLine();

    // -- Coin Details Table --
    centerText("RINCIAN KOIN (TUKAR)", 8, true);
    cursorY += 2;

    const coinBody = tx.coins.filter(c => c.qty > 0).map(c => [
        `Rp ${c.denom.toLocaleString()}`,
        c.qty.toString(),
        `Rp ${(c.denom * c.qty).toLocaleString()}`
    ]);

    autoTable(doc, {
        startY: cursorY,
        head: [['PECAHAN', 'QTY', 'TOTAL']],
        body: coinBody,
        theme: 'plain',
        styles: { fontSize: 8, font: 'helvetica', cellPadding: 1 },
        headStyles: { fontStyle: 'bold', halign: 'center' },
        columnStyles: {
            0: { halign: 'left', cellWidth: 25 },
            1: { halign: 'center', cellWidth: 15 },
            2: { halign: 'right', cellWidth: 25 }
        },
        margin: { left: marginX, right: marginX }
    });

    // Calculate cursor after table
    cursorY = (doc as any).lastAutoTable.finalY + 2;

    // Total Coins
    const totalCoins = tx.coins.reduce((acc, c) => acc + (c.denom * c.qty), 0);
    doc.setFont("helvetica", "bold");
    doc.line(marginX, cursorY, pageWidth - marginX, cursorY); // Top Border
    cursorY += 4;
    leftRightText("TOTAL TUKAR", `Rp ${totalCoins.toLocaleString()}`, 9, true);
    cursorY += 2;
    doc.line(marginX, cursorY, pageWidth - marginX, cursorY); // Bottom Border
    cursorY += 5;

    // -- Big Money Details Table --
    centerText("UANG DITERIMA (BESAR)", 8, true);
    cursorY += 2;

    const moneyBody = tx.bigMoney.filter(m => m.qty > 0).map(m => [
        `Rp ${m.denom.toLocaleString()}`,
        m.qty.toString(),
        `Rp ${(m.denom * m.qty).toLocaleString()}`
    ]);

    autoTable(doc, {
        startY: cursorY,
        head: [['PECAHAN', 'QTY', 'TOTAL']],
        body: moneyBody,
        theme: 'plain',
        styles: { fontSize: 8, font: 'helvetica', cellPadding: 1 },
        headStyles: { fontStyle: 'bold', halign: 'center' },
        columnStyles: {
            0: { halign: 'left', cellWidth: 25 },
            1: { halign: 'center', cellWidth: 15 },
            2: { halign: 'right', cellWidth: 25 }
        },
        margin: { left: marginX, right: marginX }
    });

    // Calculate cursor after table
    cursorY = (doc as any).lastAutoTable.finalY + 2;

    // Total Money
    const totalMoney = tx.bigMoney.reduce((acc, c) => acc + (c.denom * c.qty), 0);
    doc.setFont("helvetica", "bold");
    doc.line(marginX, cursorY, pageWidth - marginX, cursorY);
    cursorY += 4;
    leftRightText("TOTAL TERIMA", `Rp ${totalMoney.toLocaleString()}`, 9, true);
    cursorY += 2;
    doc.line(marginX, cursorY, pageWidth - marginX, cursorY);
    cursorY += 8;

    // -- Signatures --
    // Grid Layout Simulation
    const sigY = cursorY;
    const col1X = marginX + 10;
    const col2X = pageWidth - marginX - 10;

    doc.setFontSize(8);
    doc.text("PETUGAS", col1X, sigY, { align: "center" });
    doc.text("TIM TOKO", col2X, sigY, { align: "center" });

    // Images
    const sigHeight = 15;
    const sigWidth = 25;

    // MANDATORY SIGNATURE LOGIC WITH FALLBACK
    const adminSig = tx.adminSignature || createDummySignature(tx.userName);
    const storeSig = tx.signature || createDummySignature(tx.storeTeamName);

    try {
        doc.addImage(adminSig, 'PNG', col1X - (sigWidth / 2), sigY + 2, sigWidth, sigHeight);
    } catch (e) {
        doc.text("[Signature Error]", col1X, sigY + 10, { align: "center" });
    }

    try {
        doc.addImage(storeSig, 'PNG', col2X - (sigWidth / 2), sigY + 2, sigWidth, sigHeight);
    } catch (e) {
        doc.text("[Signature Error]", col2X, sigY + 10, { align: "center" });
    }

    cursorY += sigHeight + 5;
    doc.setFontSize(7);
    doc.text(`(${tx.userName})`, col1X, cursorY, { align: "center" });
    doc.text(`(${tx.storeTeamName})`, col2X, cursorY, { align: "center" });

    const fileName = `BA_${tx.storeName.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`;
    doc.save(fileName);
};

// ============================================
// PRINT RECEIPT (for Bluetooth Thermal Printer)
// Opens system print dialog instead of downloading
// ============================================
export const printReceiptThermal = (tx: TransactionData) => {
    // Calculate dynamic height based on content
    const baseHeight = 180;
    const itemHeight = 7;
    const coinRows = tx.coins.filter(c => c.qty > 0).length;
    const moneyRows = tx.bigMoney.filter(m => m.qty > 0).length;
    const dynamicHeight = baseHeight + (coinRows * itemHeight) + (moneyRows * itemHeight);

    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [80, dynamicHeight]
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const centerX = pageWidth / 2;
    const marginX = 5;
    let cursorY = 10;

    const centerText = (text: string, size: number = 10, isBold: boolean = false) => {
        doc.setFontSize(size);
        doc.setFont("helvetica", isBold ? "bold" : "normal");
        doc.text(text, centerX, cursorY, { align: "center" });
        cursorY += size * 0.5;
    };

    const leftRightText = (left: string, right: string, size: number = 8, isBold: boolean = false) => {
        doc.setFontSize(size);
        doc.setFont("helvetica", isBold ? "bold" : "normal");
        doc.text(left, marginX, cursorY);
        doc.text(right, pageWidth - marginX, cursorY, { align: "right" });
        cursorY += size * 0.5;
    };

    const dashedLine = () => {
        (doc as any).setLineDash([1, 1], 0);
        doc.line(marginX, cursorY, pageWidth - marginX, cursorY);
        (doc as any).setLineDash([], 0);
        cursorY += 5;
    };

    // -- Header --
    centerText("INDOMARET", 14, true);
    cursorY += 2;
    centerText("BUKTI PENUKARAN KOIN", 10, true);
    cursorY += 3;
    dashedLine();

    // -- Metadata --
    leftRightText("TANGGAL", format(new Date(tx.timestamp), 'dd/MM/yyyy HH:mm'), 8, true);
    cursorY += 2;

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("TOKO", marginX, cursorY);
    const storeText = doc.splitTextToSize(`${tx.storeCode} - ${tx.storeName}`, 45);
    doc.text(storeText, pageWidth - marginX, cursorY, { align: "right" });
    cursorY += (storeText.length * 3) + 1;

    if (tx.storeAddress) {
        doc.setFontSize(6);
        doc.setFont("helvetica", "normal");
        doc.text("ALAMAT", marginX, cursorY);
        const addrText = doc.splitTextToSize(tx.storeAddress, 45);
        doc.text(addrText, pageWidth - marginX, cursorY, { align: "right" });
        cursorY += (addrText.length * 3) + 2;
    }

    dashedLine();

    leftRightText("PIC TOKO", tx.storeTeamName, 8, true);
    cursorY += 3;
    leftRightText("JABATAN", tx.storeTeamPosition, 8, true);
    cursorY += 3;
    leftRightText("NO WA", tx.storeTeamWa, 8, true);
    cursorY += 3;
    dashedLine();

    leftRightText("PETUGAS", tx.userName, 8, true);
    cursorY += 3;
    leftRightText("KENDARAAN", tx.vehicle, 8, true);
    cursorY += 4;
    dashedLine();

    // -- Coin Details Table --
    centerText("RINCIAN KOIN (TUKAR)", 8, true);
    cursorY += 2;

    const coinBody = tx.coins.filter(c => c.qty > 0).map(c => [
        `Rp ${c.denom.toLocaleString()}`,
        c.qty.toString(),
        `Rp ${(c.denom * c.qty).toLocaleString()}`
    ]);

    autoTable(doc, {
        startY: cursorY,
        head: [['PECAHAN', 'QTY', 'TOTAL']],
        body: coinBody,
        theme: 'plain',
        styles: { fontSize: 8, font: 'helvetica', cellPadding: 1 },
        headStyles: { fontStyle: 'bold', halign: 'center' },
        columnStyles: {
            0: { halign: 'left', cellWidth: 25 },
            1: { halign: 'center', cellWidth: 15 },
            2: { halign: 'right', cellWidth: 25 }
        },
        margin: { left: marginX, right: marginX }
    });

    cursorY = (doc as any).lastAutoTable.finalY + 2;

    const totalCoins = tx.coins.reduce((acc, c) => acc + (c.denom * c.qty), 0);
    doc.setFont("helvetica", "bold");
    doc.line(marginX, cursorY, pageWidth - marginX, cursorY);
    cursorY += 4;
    leftRightText("TOTAL TUKAR", `Rp ${totalCoins.toLocaleString()}`, 9, true);
    cursorY += 2;
    doc.line(marginX, cursorY, pageWidth - marginX, cursorY);
    cursorY += 5;

    // -- Big Money Details Table --
    centerText("UANG DITERIMA (BESAR)", 8, true);
    cursorY += 2;

    const moneyBody = tx.bigMoney.filter(m => m.qty > 0).map(m => [
        `Rp ${m.denom.toLocaleString()}`,
        m.qty.toString(),
        `Rp ${(m.denom * m.qty).toLocaleString()}`
    ]);

    autoTable(doc, {
        startY: cursorY,
        head: [['PECAHAN', 'QTY', 'TOTAL']],
        body: moneyBody,
        theme: 'plain',
        styles: { fontSize: 8, font: 'helvetica', cellPadding: 1 },
        headStyles: { fontStyle: 'bold', halign: 'center' },
        columnStyles: {
            0: { halign: 'left', cellWidth: 25 },
            1: { halign: 'center', cellWidth: 15 },
            2: { halign: 'right', cellWidth: 25 }
        },
        margin: { left: marginX, right: marginX }
    });

    cursorY = (doc as any).lastAutoTable.finalY + 2;

    const totalMoney = tx.bigMoney.reduce((acc, c) => acc + (c.denom * c.qty), 0);
    doc.setFont("helvetica", "bold");
    doc.line(marginX, cursorY, pageWidth - marginX, cursorY);
    cursorY += 4;
    leftRightText("TOTAL TERIMA", `Rp ${totalMoney.toLocaleString()}`, 9, true);
    cursorY += 2;
    doc.line(marginX, cursorY, pageWidth - marginX, cursorY);
    cursorY += 5;

    // Footer for print
    doc.setFontSize(6);
    doc.setTextColor(100);
    doc.text("*** Simpan struk ini sebagai bukti sah ***", centerX, cursorY, { align: "center" });
    doc.setTextColor(0);

    // Open PDF in a hidden iframe and trigger print dialog
    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);

    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.left = '-9999px';
    printFrame.style.top = '-9999px';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.src = pdfUrl;

    printFrame.onload = () => {
        setTimeout(() => {
            printFrame.contentWindow?.print();
            // Clean up after print dialog closes
            setTimeout(() => {
                document.body.removeChild(printFrame);
                URL.revokeObjectURL(pdfUrl);
            }, 1000);
        }, 500);
    };

    document.body.appendChild(printFrame);
};

// ============================================
// DIGITAL PDF FORMAT (A4 with Photo)
// ============================================
export const generatePDFDigital = (tx: TransactionData) => {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginX = 15;
    const marginY = 15;
    let cursorY = marginY;

    // ---- HEADER SECTION (CENTERED) ----
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("INDOMARET", pageWidth / 2, cursorY, { align: "center" });
    cursorY += 6;
    doc.setFontSize(12);
    doc.text("BUKTI PENUKARAN KOIN", pageWidth / 2, cursorY, { align: "center" });
    cursorY += 12;

    // ---- METADATA SECTION (FULL WIDTH) ----
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");

    const leftMetaX = marginX;
    const rightMetaX = pageWidth / 2 + 5;
    const labelWidth = 30;

    // Helper to draw meta row
    const drawMeta = (x: number, y: number, label: string, value: string) => {
        doc.setFont("helvetica", "bold");
        doc.text(label, x, y);
        doc.setFont("helvetica", "normal");
        doc.text(":", x + labelWidth - 3, y);

        // Wrap value if needed
        const valX = x + labelWidth;
        const maxWidth = (pageWidth / 2) - marginX - labelWidth;
        const valueLines = doc.splitTextToSize(value, maxWidth);
        doc.text(valueLines, valX, y);
        return valueLines.length; // Return number of lines used
    };

    const startY = cursorY;

    // Left side meta
    drawMeta(leftMetaX, cursorY, "Tanggal", format(new Date(tx.timestamp), 'dd MMMM yyyy HH:mm', { locale: id }));
    cursorY += 5;
    drawMeta(leftMetaX, cursorY, "Toko", `${tx.storeCode} - ${tx.storeName}`);
    cursorY += 5;
    if (tx.storeAddress) {
        const lines = drawMeta(leftMetaX, cursorY, "Alamat", tx.storeAddress);
        cursorY += (lines * 4) + 1;
    }

    // Right side meta (reset Y to startY)
    let rightY = startY;
    drawMeta(rightMetaX, rightY, "Jabatan", `${tx.storeTeamPosition} - ${tx.storeTeamName}`);
    rightY += 5;
    drawMeta(rightMetaX, rightY, "No WA", tx.storeTeamWa);
    rightY += 5;
    drawMeta(rightMetaX, rightY, "Petugas", tx.userName);
    rightY += 5;
    drawMeta(rightMetaX, rightY, "Kendaraan", tx.vehicle);

    // Move cursor to below the lowest section
    cursorY = Math.max(cursorY, rightY) + 10;

    // ---- COIN TABLE (FULL WIDTH) ----
    const coinBody = tx.coins.filter(c => c.qty > 0).map(c => [
        c.denom.toLocaleString(),
        c.qty.toString(),
        (c.denom * c.qty).toLocaleString()
    ]);

    autoTable(doc, {
        startY: cursorY,
        head: [['Pecahan (Tukar)', 'Qty', 'Total']],
        body: coinBody,
        theme: 'grid',
        styles: { fontSize: 9, font: 'helvetica', cellPadding: 2 },
        headStyles: { fillColor: [230, 230, 230], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center' },
        columnStyles: {
            0: { halign: 'right' },
            1: { halign: 'center' },
            2: { halign: 'right' }
        },
        margin: { left: marginX, right: marginX }
    });

    cursorY = (doc as any).lastAutoTable.finalY + 2;

    // Total Coins
    const totalCoins = tx.coins.reduce((acc, c) => acc + (c.denom * c.qty), 0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(`TOTAL TUKAR: Rp ${totalCoins.toLocaleString()}`, pageWidth - marginX, cursorY + 5, { align: 'right' });
    cursorY += 12;

    // ---- BIG MONEY TABLE (FULL WIDTH) ----
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("UANG DITERIMA DARI TOKO", marginX, cursorY);
    cursorY += 5;

    const moneyBody = tx.bigMoney.filter(m => m.qty > 0).map(m => [
        m.denom.toLocaleString(),
        m.qty.toString(),
        (m.denom * m.qty).toLocaleString()
    ]);

    autoTable(doc, {
        startY: cursorY,
        head: [['Pecahan', 'Qty', 'Nominal']],
        body: moneyBody,
        theme: 'grid',
        styles: { fontSize: 9, font: 'helvetica', cellPadding: 2 },
        headStyles: { fillColor: [230, 230, 230], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center' },
        columnStyles: {
            0: { halign: 'right' },
            1: { halign: 'center' },
            2: { halign: 'right' }
        },
        margin: { left: marginX, right: marginX }
    });

    cursorY = (doc as any).lastAutoTable.finalY + 2;

    // Total Money
    const totalMoney = tx.bigMoney.reduce((acc, m) => acc + (m.denom * m.qty), 0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(`Total Terima: Rp ${totalMoney.toLocaleString()}`, pageWidth - marginX, cursorY + 5, { align: 'right' });
    cursorY += 15;

    // ---- SIGNATURES ----
    const sigY = cursorY;
    const sigWidth = 40;
    const sigHeight = 20;
    const sig1X = marginX + 30;
    const sig2X = pageWidth - marginX - 70;

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Petugas", sig1X, sigY, { align: "center" });
    doc.text("Tim toko", sig2X, sigY, { align: "center" });

    // SIGNATURE LOGIC
    const adminSig = tx.adminSignature || createDummySignature(tx.userName);
    const storeSig = tx.signature || createDummySignature(tx.storeTeamName);

    try {
        doc.addImage(adminSig, 'PNG', sig1X - sigWidth / 2, sigY + 3, sigWidth, sigHeight);
    } catch (e) {
        doc.text("[Signature Error]", sig1X, sigY + 10, { align: "center" });
    }

    try {
        doc.addImage(storeSig, 'PNG', sig2X - sigWidth / 2, sigY + 3, sigWidth, sigHeight);
    } catch (e) {
        doc.text("[Signature Error]", sig2X, sigY + 10, { align: "center" });
    }

    // Names below signatures
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`(${tx.userName.toUpperCase()})`, sig1X, sigY + sigHeight + 8, { align: "center" });
    doc.text(`(${tx.storeTeamName})`, sig2X, sigY + sigHeight + 8, { align: "center" });

    cursorY = sigY + sigHeight + 20;

    // ---- EVIDENCE PHOTO (BOTTOM) ----
    if (tx.evidencePhoto) {
        // Calculate available space on current page
        const footerHeight = 20; // Space for footer text
        const availableHeight = pageHeight - cursorY - footerHeight - marginY;

        // Target is large (120mm), but shrink if needed to fit on one page
        // Minimum size to be useful is ~60mm, otherwise break page
        let photoHeight = Math.min(120, availableHeight);
        let photoWidth = 160;

        if (photoHeight < 60) {
            // Too small for current page, move to next
            doc.addPage();
            cursorY = marginY;
            photoHeight = 120; // Full size on new page
            photoWidth = 160; // Reset width for full size
        } else {
            // Fits on current page (possibly slightly smaller than 120mm)
            // Adjust width to maintain aspect ratio 4:3 (160:120)
            photoWidth = photoHeight * (160 / 120);
        }

        const photoX = (pageWidth - photoWidth) / 2;

        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text("FOTO BUKTI PENUKARAN", pageWidth / 2, cursorY, { align: "center" });
        cursorY += 5;

        try {
            doc.addImage(tx.evidencePhoto, 'JPEG', photoX, cursorY, photoWidth, photoHeight);
        } catch (e) {
            drawPhotoPlaceholder(doc, photoX, cursorY, photoWidth, photoHeight);
        }
        cursorY += photoHeight + 10;
    }

    // Footer
    const footerY = pageHeight - 10; // Fixed at bottom of page
    doc.setFontSize(7);
    doc.setTextColor(100);
    doc.text("*** Simpan struk ini sebagai bukti sah ***", pageWidth / 2, footerY, { align: "center" });

    const fileName = `BA_Digital_${tx.storeName.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`;
    doc.save(fileName);
};

// Helper for photo placeholder
const drawPhotoPlaceholder = (doc: jsPDF, x: number, y: number, w: number, h: number) => {
    doc.setDrawColor(200);
    doc.setFillColor(240, 240, 240);
    doc.rect(x, y, w, h, 'FD');
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text("Foto Tidak Tersedia", x + w / 2, y + h / 2, { align: "center" });
    doc.setTextColor(0);
};
