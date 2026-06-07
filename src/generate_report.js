const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  ImageRun, Header, Footer, AlignmentType, HeadingLevel, BorderStyle,
  WidthType, ShadingType, VerticalAlign, PageNumber, PageBreak,
  LevelFormat, TableOfContents, ExternalHyperlink, Tab, TabStopType,
  TabStopPosition
} = require("docx");

const fs = require("fs");
const path = require("path");

// ── Helpers ──────────────────────────────────────────────────────────────────
const B = (text, size = 24, color = "000000") =>
  new TextRun({ text, bold: true, size, color, font: "Arial" });

const T = (text, size = 22, color = "1A1A1A") =>
  new TextRun({ text, size, color, font: "Arial" });

const IT = (text, size = 22) =>
  new TextRun({ text, italics: true, size, color: "444444", font: "Arial" });

const BREAK = new Paragraph({ children: [] });

const HR = (color = "2E86AB") =>
  new Paragraph({
    children: [],
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color, space: 1 } },
    spacing: { after: 160 }
  });

const H1 = (text) =>
  new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [new TextRun({ text, bold: true, size: 36, font: "Arial", color: "2E3A59" })],
    spacing: { before: 400, after: 200 },
  });

const H2 = (text) =>
  new Paragraph({
    heading: HeadingLevel.HEADING_2,
    children: [new TextRun({ text, bold: true, size: 28, font: "Arial", color: "2E86AB" })],
    spacing: { before: 300, after: 160 },
  });

const H3 = (text) =>
  new Paragraph({
    heading: HeadingLevel.HEADING_3,
    children: [new TextRun({ text, bold: true, size: 24, font: "Arial", color: "3C3C3C" })],
    spacing: { before: 200, after: 120 },
  });

const P = (text, size = 22) =>
  new Paragraph({
    children: [T(text, size)],
    spacing: { after: 180, line: 360 },
  });

const bullet = (text) =>
  new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    children: [T(text, 22)],
    spacing: { after: 100 },
  });

const numbered = (text) =>
  new Paragraph({
    numbering: { reference: "numbers", level: 0 },
    children: [T(text, 22)],
    spacing: { after: 100 },
  });

const pageBreak = () =>
  new Paragraph({ children: [new PageBreak()] });

// ── Image loader ─────────────────────────────────────────────────────────────
function loadImage(imgPath, widthEmu, heightEmu) {
  const fullPath = path.resolve(__dirname, "..", imgPath);
  if (!fs.existsSync(fullPath)) {
    console.warn(`Missing: ${fullPath}`);
    return null;
  }
  const data = fs.readFileSync(fullPath);
  const ext = path.extname(fullPath).replace(".", "").toLowerCase();
  const typeMap = { png: "png", jpg: "jpg", jpeg: "jpg", gif: "gif" };
  return new ImageRun({
    data,
    transformation: { width: Math.round(widthEmu / 9144), height: Math.round(heightEmu / 9144) },
    type: typeMap[ext] || "png",
  });
}

// In docx ImageRun, dimensions are in pixels (72dpi pt equivalent).
// We use pixel dimensions directly. 1 inch = 96px at screen res.
function img(relPath, widthPx, heightPx) {
  const fullPath = path.resolve(__dirname, "..", relPath);
  if (!fs.existsSync(fullPath)) {
    return new Paragraph({ children: [new TextRun({ text: `[Figure: ${relPath} not found]`, italics: true, color: "FF0000", font: "Arial" })] });
  }
  const data = fs.readFileSync(fullPath);
  return new Paragraph({
    children: [new ImageRun({ data, transformation: { width: widthPx, height: heightPx }, type: "png" })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 160, after: 160 },
  });
}

function figCaption(text) {
  return new Paragraph({
    children: [new TextRun({ text, italics: true, size: 18, color: "666666", font: "Arial" })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 280 },
  });
}

// ── Table builder ─────────────────────────────────────────────────────────────
const CELL_W = 1560; // DXA — 6 equal cols across 9360 DXA
const BORDER = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const BORDERS = { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER };

function headerCell(text, widthDXA = CELL_W) {
  return new TableCell({
    borders: BORDERS,
    width: { size: widthDXA, type: WidthType.DXA },
    shading: { fill: "2E3A59", type: ShadingType.CLEAR },
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text, bold: true, size: 20, color: "FFFFFF", font: "Arial" })]
    })]
  });
}

function dataCell(text, widthDXA = CELL_W, shade = "F5F8FC", align = AlignmentType.LEFT, bold = false) {
  return new TableCell({
    borders: BORDERS,
    width: { size: widthDXA, type: WidthType.DXA },
    shading: { fill: shade, type: ShadingType.CLEAR },
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [new Paragraph({
      alignment: align,
      children: [new TextRun({ text: String(text), size: 20, color: "1A1A1A", font: "Arial", bold })]
    })]
  });
}

// ── DOCUMENT ─────────────────────────────────────────────────────────────────
const doc = new Document({
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [{
          level: 0, format: LevelFormat.BULLET, text: "•",
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } }
        }]
      },
      {
        reference: "numbers",
        levels: [{
          level: 0, format: LevelFormat.DECIMAL, text: "%1.",
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } }
        }]
      },
    ]
  },
  styles: {
    default: { document: { run: { font: "Arial", size: 22, color: "1A1A1A" } } },
    paragraphStyles: [
      {
        id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 36, bold: true, font: "Arial", color: "2E3A59" },
        paragraph: { spacing: { before: 400, after: 200 }, outlineLevel: 0 }
      },
      {
        id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, font: "Arial", color: "2E86AB" },
        paragraph: { spacing: { before: 300, after: 160 }, outlineLevel: 1 }
      },
      {
        id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, font: "Arial", color: "3C3C3C" },
        paragraph: { spacing: { before: 200, after: 120 }, outlineLevel: 2 }
      },
    ]
  },

  sections: [
    // ══════════════════════════════════════════════════════════
    //  SECTION 1: TITLE PAGE
    // ══════════════════════════════════════════════════════════
    {
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
        }
      },
      children: [
        BREAK, BREAK,
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [B("STATE UNIVERSITY", 24, "666666")],
          spacing: { after: 80 }
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [T("Faculty of Informatics and Computer Science", 22, "666666")],
          spacing: { after: 80 }
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [T("Department of Artificial Intelligence and Data Science", 22, "666666")],
          spacing: { after: 600 }
        }),

        new Paragraph({
          alignment: AlignmentType.CENTER,
          border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: "2E86AB", space: 1 } },
          children: [],
          spacing: { after: 400 }
        }),

        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [B("COURSE PROJECT REPORT", 36, "2E3A59")],
          spacing: { after: 200 }
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [B("Comparative Analysis of Clustering Algorithms\nfor Consumer Segmentation", 32, "2E86AB")],
          spacing: { after: 400 }
        }),

        new Paragraph({
          alignment: AlignmentType.CENTER,
          border: { top: { style: BorderStyle.SINGLE, size: 8, color: "2E86AB", space: 1 } },
          children: [],
          spacing: { after: 400 }
        }),

        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [T("Discipline: Machine Learning", 22, "444444")],
          spacing: { after: 80 }
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [T("Student: [Your Name]", 22, "444444")],
          spacing: { after: 80 }
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [T("Group: [Your Group]", 22, "444444")],
          spacing: { after: 80 }
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [T("Instructor: [Instructor Name]", 22, "444444")],
          spacing: { after: 600 }
        }),

        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [T("City — 2025", 22, "666666")],
          spacing: { after: 0 }
        }),
      ]
    },

    // ══════════════════════════════════════════════════════════
    //  SECTIONS 2+: Main content
    // ══════════════════════════════════════════════════════════
    {
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1440, right: 1260, bottom: 1260, left: 1440 }
        }
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            children: [
              new TextRun({ text: "Clustering Algorithms for Consumer Segmentation  |  ML Course Project", size: 18, color: "888888", font: "Arial" })
            ],
            border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC", space: 1 } }
          })]
        })
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            children: [
              new TextRun({ text: "Page ", size: 18, color: "888888", font: "Arial" }),
              new TextRun({ children: [PageNumber.CURRENT], size: 18, color: "2E86AB", font: "Arial" }),
              new TextRun({ text: " of ", size: 18, color: "888888", font: "Arial" }),
              new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, color: "2E86AB", font: "Arial" }),
            ],
            alignment: AlignmentType.RIGHT,
            border: { top: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC", space: 1 } }
          })]
        })
      },
      children: [

        // ─── ABSTRACT ────────────────────────────────────────────
        H1("Abstract"),
        HR(),
        P("This project investigates and compares three unsupervised machine learning algorithms — K-Means, DBSCAN, and Agglomerative Clustering (Ward linkage) — for the purpose of customer segmentation based on transactional behavioral data. A synthetic dataset of 7,636 transactions across 800 customers was generated to simulate realistic e-commerce purchase patterns across four latent consumer personas."),
        P("A rich feature set was engineered beyond the conventional RFM (Recency, Frequency, Monetary) framework, incorporating Spending Volatility (coefficient of variation), Category Entropy (Shannon entropy of purchase breadth), inter-purchase gap statistics, and a linear Trend Score capturing the trajectory of monthly spend. A key methodological contribution is the use of Bootstrap Partition Stability (measured via Adjusted Rand Index over 50 resamples) to evaluate how reproducible each algorithm's output is — a criterion absent from most standard comparisons. Results show that K-Means achieves the best balance between interpretability, metric performance (Silhouette = 0.754), and stability (ARI = 0.906). Three actionable customer segments were identified: Premium, Budget Conscious, and Churned/Dormant, each accompanied by tailored marketing strategies."),
        BREAK,

        // ─── TABLE OF CONTENTS ───────────────────────────────────
        H1("Table of Contents"),
        HR(),
        new TableOfContents("Contents", {
          hyperlink: true,
          headingStyleRange: "1-3",
        }),
        pageBreak(),

        // ─── INTRODUCTION ────────────────────────────────────────
        H1("Introduction"),
        HR(),
        H2("1.1  Relevance and Problem Statement"),
        P("Modern businesses generate massive volumes of transactional data daily. The ability to identify distinct customer segments — groups with similar purchasing behaviors — is central to effective marketing, inventory planning, and customer retention. Manual rule-based segmentation (e.g., 'customers who spent >$500 in the last quarter') is brittle and fails to capture the complexity of real behavioral patterns."),
        P("Unsupervised machine learning, specifically clustering, offers a data-driven approach to customer segmentation that adapts to the structure of the data itself. However, different clustering algorithms make fundamentally different assumptions about cluster shape, density, and the number of groups — and no single algorithm is universally superior."),
        H2("1.2  Goal and Objectives"),
        P("Goal: To identify meaningful customer segments from transactional data using three clustering algorithms and recommend targeted marketing strategies for each segment."),
        P("Objectives:"),
        bullet("Design and implement a feature engineering pipeline that goes beyond basic RFM metrics."),
        bullet("Apply K-Means, DBSCAN, and Agglomerative Clustering to the feature matrix."),
        bullet("Evaluate algorithms using internal metrics (Silhouette, Davies-Bouldin, Calinski-Harabasz) and a novel Bootstrap Stability criterion."),
        bullet("Profile and interpret the resulting clusters with business-meaningful labels."),
        bullet("Propose concrete, segment-specific marketing strategies with KPIs."),
        BREAK,
        H2("1.3  Subject Matter and Approach"),
        P("The subject of this project is customer behavioral data modeled as a set of derived features per customer. The solution approach consists of a four-stage pipeline:"),
        numbered("Synthetic data generation (transactional records with 4 hidden personas)"),
        numbered("Feature engineering: RFM + 6 additional behavioral dimensions"),
        numbered("Clustering with 3 algorithms, hyperparameter tuning, and multi-criteria evaluation"),
        numbered("Segment profiling, business labeling, and marketing strategy formulation"),
        pageBreak(),

        // ─── CHAPTER 1 ───────────────────────────────────────────
        H1("Chapter 1 — Analysis and Design"),
        HR(),
        H2("1.1  Problem Formulation"),
        P("Given a dataset of customer transactions T = {(c, d, a, k)} where c is the customer ID, d is the transaction date, a is the monetary amount, and k is the product category, the task is to define a mapping f: C → {1,...,K} that assigns each customer c ∈ C to a cluster label such that customers within the same cluster share similar behavioral profiles."),
        P("This is an unsupervised learning problem: there are no pre-defined labels. The quality of the solution is measured by both internal metrics (compactness and separation of clusters) and external reproducibility (stability across data perturbations)."),
        H2("1.2  Feature Space Design"),
        P("Nine features were engineered per customer, organized into four groups:"),
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [2000, 3500, 3860],
          rows: [
            new TableRow({ children: [headerCell("Group", 2000), headerCell("Feature", 3500), headerCell("Description", 3860)] }),
            new TableRow({ children: [dataCell("RFM", 2000, "EBF5FB"), dataCell("Recency", 3500), dataCell("Days since last purchase", 3860)] }),
            new TableRow({ children: [dataCell("RFM", 2000, "EBF5FB"), dataCell("Frequency", 3500), dataCell("Total number of transactions", 3860)] }),
            new TableRow({ children: [dataCell("RFM", 2000, "EBF5FB"), dataCell("Monetary", 3500), dataCell("Total spend (sum of amounts)", 3860)] }),
            new TableRow({ children: [dataCell("Order Behavior", 2000, "F5FBF0"), dataCell("Avg. Order Value", 3500), dataCell("Mean transaction amount", 3860)] }),
            new TableRow({ children: [dataCell("Volatility", 2000, "FFF8EC"), dataCell("Spend CV", 3500), dataCell("Std/Mean of transaction amounts (coefficient of variation)", 3860)] }),
            new TableRow({ children: [dataCell("Diversity", 2000, "F8F0FB"), dataCell("Category Entropy", 3500), dataCell("Shannon entropy of category distribution", 3860)] }),
            new TableRow({ children: [dataCell("Diversity", 2000, "F8F0FB"), dataCell("N Categories", 3500), dataCell("Count of distinct categories purchased", 3860)] }),
            new TableRow({ children: [dataCell("Trend", 2000, "FEF3F3"), dataCell("Trend Score", 3500), dataCell("Linear regression slope of monthly spend", 3860)] }),
            new TableRow({ children: [dataCell("Gaps", 2000, "F5F5F5"), dataCell("Avg. Purchase Gap", 3500), dataCell("Mean inter-transaction interval in days", 3860)] }),
          ]
        }),
        BREAK,
        P("Feature scaling was applied using RobustScaler (median/IQR-based), which is robust to the heavy-tailed distributions typical of monetary data."),
        BREAK,
        H2("1.3  Algorithm Overview"),
        H3("K-Means"),
        P("Minimizes within-cluster sum of squared distances to centroids. Assumes spherical, equally-sized clusters. Requires pre-specifying K. Deterministic (with fixed seed). Time complexity: O(n · K · I · d) where I = iterations, d = dimensions."),
        H3("DBSCAN (Density-Based Spatial Clustering)"),
        P("Groups points in high-density regions; marks isolated points as noise. Does not require K; instead requires eps (neighborhood radius) and min_samples. Handles arbitrary cluster shapes. The k-distance elbow method was used to auto-tune eps."),
        H3("Agglomerative Clustering (Ward Linkage)"),
        P("Bottom-up hierarchical method: starts with each point as its own cluster and merges pairs that minimize the increase in total within-cluster variance (Ward criterion). Produces a dendrogram that reveals the hierarchical structure of the data."),
        H2("1.4  Evaluation Metrics"),
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [2500, 2800, 4060],
          rows: [
            new TableRow({ children: [headerCell("Metric", 2500), headerCell("Formula (summary)", 2800), headerCell("Interpretation", 4060)] }),
            new TableRow({ children: [dataCell("Silhouette Score", 2500, "EBF5FB"), dataCell("(b - a) / max(a, b)", 2800), dataCell("[-1, 1]; higher = better separation and cohesion", 4060)] }),
            new TableRow({ children: [dataCell("Davies-Bouldin Index", 2500, "F5FBF0"), dataCell("Avg. max cluster scatter ratio", 2800), dataCell("Lower = better (clusters compact and far apart)", 4060)] }),
            new TableRow({ children: [dataCell("Calinski-Harabasz", 2500, "FFF8EC"), dataCell("Between / Within scatter ratio", 2800), dataCell("Higher = better (tight, well-separated clusters)", 4060)] }),
            new TableRow({ children: [dataCell("Bootstrap ARI", 2500, "F8F0FB"), dataCell("Mean ARI over 50 resamples", 2800), dataCell("[0, 1]; measures partition reproducibility (novel criterion)", 4060)] }),
          ]
        }),
        pageBreak(),

        // ─── CHAPTER 2 ───────────────────────────────────────────
        H1("Chapter 2 — Implementation"),
        HR(),
        H2("2.1  Data Generation"),
        P("A synthetic dataset was generated using four latent customer personas (Premium, Regular, Economy, Churned), each with distinct statistical properties for purchase frequency, spend level, recency, and category diversity. This design choice allows post-hoc validation of clustering quality by comparing discovered clusters against the ground-truth personas — without using the persona labels during clustering itself."),
        P("The dataset contains 7,636 transactions from 800 unique customers, covering 8 product categories over a simulated 12-month period."),
        H2("2.2  Feature Engineering Pipeline"),
        P("The src/feature_engineering.py module implements the following per-customer aggregations:"),
        bullet("RFM base features computed relative to a reference date (2024-12-31)."),
        bullet("Spending CV: measures volatility. A CV > 0.5 indicates erratic, promotion-driven behavior."),
        bullet("Category Entropy: H = -Σ p_i · log(p_i) where p_i is the proportion of purchases in category i. Higher entropy = broader shopping behavior."),
        bullet("Trend Score: slope of OLS regression of monthly spend against month index. Positive = growing engagement; negative = declining."),
        bullet("Inter-purchase gap statistics (mean and std) quantify purchase rhythm regularity."),
        H2("2.3  K Selection (Elbow + Silhouette)"),
        P("For K-Means, the optimal number of clusters was determined by evaluating both the Elbow method (inertia) and Silhouette Score for k = 2 through 8. The silhouette score peaked at k = 3, which was selected as the final configuration."),
        img("outputs/figures/elbow_silhouette.png", 580, 200),
        figCaption("Figure 1. Elbow method (left) and Silhouette Score (right) for k = 2 to 8. Optimal k = 3."),
        H2("2.4  DBSCAN Hyperparameter Tuning"),
        P("The eps parameter was selected using the k-distance graph (k=5 nearest neighbor distances sorted in ascending order). The point of maximum curvature in the resulting curve — computed geometrically using perpendicular distance to the diagonal — was used as the elbow. This yielded eps = 2.979 with min_samples = 8, resulting in 4 DBSCAN clusters and 23 noise points (2.9% of the dataset)."),
        H2("2.5  Hierarchical Clustering (Dendrogram)"),
        P("The Ward linkage dendrogram was computed on a random sample of 200 customers for readability. It visually confirms the presence of 3 primary groupings, consistent with the silhouette-optimal K = 3."),
        img("outputs/figures/dendrogram.png", 580, 210),
        figCaption("Figure 2. Ward linkage dendrogram (200-customer sample). Horizontal cut at k = 3 is visually natural."),
        H2("2.6  2D Projection (UMAP)"),
        P("All three clustering solutions were projected into 2D using UMAP (Uniform Manifold Approximation and Projection) with n_neighbors = 20 and min_dist = 0.1. UMAP was chosen over PCA because it preserves local cluster topology, making cluster boundaries more visually distinct."),
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [3120, 3120, 3120],
          rows: [
            new TableRow({ children: [headerCell("K-Means (k=3)", 3120), headerCell("Agglomerative (k=3)", 3120), headerCell("DBSCAN (eps=2.979)", 3120)] }),
            new TableRow({ children: [
              new TableCell({ borders: BORDERS, width: { size: 3120, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 80, right: 80 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new ImageRun({ data: fs.readFileSync("outputs/figures/kmeans_clusters.png"), transformation: { width: 210, height: 145 }, type: "png" })] })] }),
              new TableCell({ borders: BORDERS, width: { size: 3120, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 80, right: 80 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new ImageRun({ data: fs.readFileSync("outputs/figures/agg_clusters.png"), transformation: { width: 210, height: 145 }, type: "png" })] })] }),
              new TableCell({ borders: BORDERS, width: { size: 3120, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 80, right: 80 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new ImageRun({ data: fs.readFileSync("outputs/figures/dbscan_clusters.png"), transformation: { width: 210, height: 145 }, type: "png" })] })] }),
            ]})
          ]
        }),
        BREAK,
        figCaption("Figure 3. UMAP 2D projections for all three algorithms. K-Means and Agglomerative show clearly separated clusters. DBSCAN identifies a small additional micro-cluster and 23 noise points."),
        pageBreak(),

        // ─── CHAPTER 3 ───────────────────────────────────────────
        H1("Chapter 3 — Testing and Results"),
        HR(),
        H2("3.1  Internal Evaluation Metrics"),
        P("All three algorithms were evaluated on standard internal clustering metrics computed on the scaled feature matrix. DBSCAN metrics exclude noise points."),
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [2600, 1690, 1690, 1690, 1690],
          rows: [
            new TableRow({ children: [headerCell("Algorithm", 2600), headerCell("N Clusters", 1690), headerCell("Silhouette ↑", 1690), headerCell("Davies-Bouldin ↓", 1690), headerCell("Calinski-H. ↑", 1690)] }),
            new TableRow({ children: [dataCell("K-Means", 2600, "EBF5FB", AlignmentType.LEFT, true), dataCell("3", 1690, "EBF5FB", AlignmentType.CENTER), dataCell("0.7538", 1690, "EBF5FB", AlignmentType.CENTER), dataCell("0.5125", 1690, "EBF5FB", AlignmentType.CENTER), dataCell("752.77", 1690, "EBF5FB", AlignmentType.CENTER)] }),
            new TableRow({ children: [dataCell("Agglomerative (Ward)", 2600, "F5FBF0", AlignmentType.LEFT, true), dataCell("3", 1690, "F5FBF0", AlignmentType.CENTER), dataCell("0.7776", 1690, "F5FBF0", AlignmentType.CENTER), dataCell("0.3578", 1690, "F5FBF0", AlignmentType.CENTER), dataCell("549.29", 1690, "F5FBF0", AlignmentType.CENTER)] }),
            new TableRow({ children: [dataCell("DBSCAN", 2600, "FFF8EC", AlignmentType.LEFT, true), dataCell("4", 1690, "FFF8EC", AlignmentType.CENTER), dataCell("0.6093", 1690, "FFF8EC", AlignmentType.CENTER), dataCell("0.6311", 1690, "FFF8EC", AlignmentType.CENTER), dataCell("420.48", 1690, "FFF8EC", AlignmentType.CENTER)] }),
          ]
        }),
        BREAK,
        P("Agglomerative clustering achieves the best Silhouette (0.778) and Davies-Bouldin (0.358) scores, indicating tighter and better-separated clusters. K-Means leads on Calinski-Harabasz (752.77), reflecting compact, globular groups. DBSCAN performs lower on all internal metrics, largely because its 4th cluster is a small, dense micro-group rather than a structurally meaningful segment."),
        H2("3.2  Bootstrap Stability Analysis (Novel Contribution)"),
        P("A key weakness of internal metrics is that they measure quality on the full dataset — but a clustering algorithm that produces very different partitions on slightly different data is not trustworthy in practice. To address this, 50 bootstrap resamples were generated per algorithm. For each resample, the algorithm was refitted and the Adjusted Rand Index (ARI) between the bootstrap partition and the full-data partition was computed. The mean and standard deviation of these 50 ARI values constitute the stability score."),
        img("outputs/figures/stability_comparison.png", 500, 230),
        figCaption("Figure 4. Bootstrap partition stability. Error bars show ±1 std. over 50 resamples. Higher and narrower bars indicate more reliable algorithms."),
        BREAK,
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [3120, 2400, 1920, 1920],
          rows: [
            new TableRow({ children: [headerCell("Algorithm", 3120), headerCell("Mean ARI", 2400), headerCell("Std ARI", 1920), headerCell("Verdict", 1920)] }),
            new TableRow({ children: [dataCell("K-Means", 3120, "EBF5FB"), dataCell("0.906", 2400, "EBF5FB", AlignmentType.CENTER), dataCell("0.069", 1920, "EBF5FB", AlignmentType.CENTER), dataCell("Stable", 1920, "D5F5E3", AlignmentType.CENTER)] }),
            new TableRow({ children: [dataCell("Agglomerative (Ward)", 3120, "F5FBF0"), dataCell("0.628", 2400, "F5FBF0", AlignmentType.CENTER), dataCell("0.215", 1920, "F5FBF0", AlignmentType.CENTER), dataCell("Unstable", 1920, "FEF3F3", AlignmentType.CENTER)] }),
            new TableRow({ children: [dataCell("DBSCAN", 3120, "FFF8EC"), dataCell("0.971", 2400, "FFF8EC", AlignmentType.CENTER), dataCell("0.019", 1920, "FFF8EC", AlignmentType.CENTER), dataCell("Very Stable", 1920, "D5F5E3", AlignmentType.CENTER)] }),
          ]
        }),
        BREAK,
        P("DBSCAN achieves the highest stability (ARI = 0.971, std = 0.019), meaning its partition is nearly identical across resamples. However, its internal metrics are the weakest and it identifies 4 clusters vs. 3, complicating business interpretation. Agglomerative clustering, despite the best internal metrics, is surprisingly unstable (ARI = 0.628, std = 0.215) — its hierarchical merging decisions are sensitive to small changes in the data. K-Means provides the best overall balance: good internal metrics AND high stability (ARI = 0.906). It is selected as the recommended algorithm."),
        H2("3.3  Cluster Profiles and Segment Interpretation"),
        P("The K-Means solution (k=3) was profiled by computing feature means per cluster. Clusters were then assigned business labels based on the dominant characteristics:"),
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [1600, 1900, 1700, 1400, 1130, 1630],
          rows: [
            new TableRow({ children: [headerCell("Segment", 1600), headerCell("Recency (days)", 1900), headerCell("Frequency", 1700), headerCell("Monetary ($)", 1400), headerCell("Spend CV", 1130), headerCell("Cat. Entropy", 1630)] }),
            new TableRow({ children: [dataCell("💎 Premium", 1600, "EBF5FB"), dataCell("16.8", 1900, "EBF5FB", AlignmentType.CENTER), dataCell("24.5", 1700, "EBF5FB", AlignmentType.CENTER), dataCell("6,943", 1400, "EBF5FB", AlignmentType.CENTER), dataCell("0.28", 1130, "EBF5FB", AlignmentType.CENTER), dataCell("1.41", 1630, "EBF5FB", AlignmentType.CENTER)] }),
            new TableRow({ children: [dataCell("💰 Budget Conscious", 1600, "F5FBF0"), dataCell("112.4", 1900, "F5FBF0", AlignmentType.CENTER), dataCell("9.1", 1700, "F5FBF0", AlignmentType.CENTER), dataCell("1,194", 1400, "F5FBF0", AlignmentType.CENTER), dataCell("0.38", 1130, "F5FBF0", AlignmentType.CENTER), dataCell("0.66", 1630, "F5FBF0", AlignmentType.CENTER)] }),
            new TableRow({ children: [dataCell("🚪 Churned/Dormant", 1600, "FEF3F3"), dataCell("788.7", 1900, "FEF3F3", AlignmentType.CENTER), dataCell("1.1", 1700, "FEF3F3", AlignmentType.CENTER), dataCell("55.5", 1400, "FEF3F3", AlignmentType.CENTER), dataCell("0.16", 1130, "FEF3F3", AlignmentType.CENTER), dataCell("0.02", 1630, "FEF3F3", AlignmentType.CENTER)] }),
          ]
        }),
        BREAK,
        img("outputs/figures/radar_chart.png", 400, 380),
        figCaption("Figure 5. Radar chart of normalized cluster profiles (recency is inverted: higher = more recent). Premium segment dominates on all positive dimensions."),
        BREAK,
        img("outputs/figures/segment_pie.png", 350, 280),
        figCaption("Figure 6. Customer segment distribution. Budget Conscious customers represent the majority (90.6%), while Premium (5.1%) and Churned (4.2%) are smaller but strategically critical groups."),
        BREAK,
        H2("3.4  Feature Discriminative Power"),
        img("outputs/figures/feature_importance.png", 500, 240),
        figCaption("Figure 7. ANOVA F-statistic per feature across K-Means clusters. Higher F = more discriminative. avg_purchase_gap and monetary are the most powerful separators."),
        BREAK,
        P("The ANOVA F-test confirms that avg_purchase_gap (F >> monetary, frequency) is the single most discriminative feature — effectively separating churned customers (gap ~821 days) from active ones (~3–42 days). This motivates its inclusion over simple RFM, which would have missed this behavioral dimension."),
        H2("3.5  Pairwise Feature Relationships"),
        img("outputs/figures/pairplot.png", 560, 500),
        figCaption("Figure 8. Pairwise scatter plots of 5 key features, colored by K-Means cluster. Clear diagonal separation is visible in recency vs. frequency and recency vs. monetary."),
        pageBreak(),

        // ─── CONCLUSION ──────────────────────────────────────────
        H1("Conclusion"),
        HR(),
        P("This project successfully completed all stated objectives. Three clustering algorithms were implemented, tuned, and rigorously evaluated on a rich 9-dimensional customer feature matrix. The key findings are:"),
        bullet("K-Means with k = 3 provides the best balance of partition quality (Silhouette = 0.754) and stability (Bootstrap ARI = 0.906), making it the recommended algorithm for this segmentation task."),
        bullet("Agglomerative Clustering achieves the best raw internal metrics but suffers from high instability (std = 0.215), making it unreliable for production use without further validation."),
        bullet("DBSCAN is highly stable but detects a 4th micro-cluster and is sensitive to its eps parameter, requiring careful tuning for each new dataset."),
        bullet("The novel Bootstrap Stability criterion exposed a meaningful gap between algorithms that internal metrics alone would have missed."),
        bullet("Three distinct customer segments were identified and labeled: Premium (5.1%), Budget Conscious (90.6%), and Churned/Dormant (4.2%), each with tailored marketing strategies."),
        BREAK,
        H2("Potential Improvements"),
        bullet("Apply t-SNE or PHATE projections for higher-quality visualization of cluster structure."),
        bullet("Incorporate temporal dynamics: treat customer behavior as a time series and apply sequence clustering."),
        bullet("Evaluate Gaussian Mixture Models (GMM) as a soft-assignment alternative to K-Means."),
        bullet("Extend to real-world datasets (e.g., UCI Online Retail, Instacart) for external validation."),
        bullet("Build a live dashboard (Streamlit/Dash) for interactive segment exploration by marketing teams."),
        pageBreak(),

        // ─── MARKETING STRATEGY ──────────────────────────────────
        H1("Marketing Strategy by Segment"),
        HR(),

        H2("💎 Premium — VIP Retention Focus"),
        P("Profile: Recency = 16.8 days, Frequency = 24.5 tx, Total Spend = $6,943, Category Entropy = 1.41 (broad multi-category shoppers). Represents only 5.1% of customers but is disproportionately valuable."),
        bullet("Invite to exclusive VIP loyalty tier with early access to sales and new products."),
        bullet("Personalized 1-to-1 recommendations based on cross-category purchase history."),
        bullet("Assign a dedicated account manager or personal shopper service."),
        bullet("Send curated gifts or thank-you cards on purchase anniversaries."),
        new Paragraph({ children: [new TextRun({ text: "KPIs: CLV, Repeat Purchase Rate, NPS | Risk: Churn if undervalued — invest in retention proactively.", italics: true, size: 20, color: "666666", font: "Arial" })], spacing: { after: 200 } }),

        H2("💰 Budget Conscious — Volume and Basket Growth"),
        P("Profile: Recency = 112 days, Frequency = 9.1 tx, Total Spend = $1,194, Spend CV = 0.38 (moderate volatility). The majority segment — critical for revenue at scale."),
        bullet("Price-match guarantee and value bundles to reinforce price-conscious loyalty."),
        bullet("Points-based loyalty rewards to build habitual purchasing."),
        bullet("Email reminders timed to their typical purchase cycle gap (~42 days)."),
        bullet("Cross-sell via 'frequently bought together' modules to expand basket size."),
        new Paragraph({ children: [new TextRun({ text: "KPIs: Basket Size, Purchase Frequency, Coupon Redemption Rate | Risk: Thin margins — focus on volume, not discounting.", italics: true, size: 20, color: "666666", font: "Arial" })], spacing: { after: 200 } }),

        H2("🚪 Churned / Dormant — Win-Back Campaign"),
        P("Profile: Recency = 789 days, Frequency = 1.1 tx, Total Spend = $55.5, Category Entropy ≈ 0 (barely any category diversity). These customers have effectively stopped engaging."),
        bullet("Win-back email: 'We miss you — here is an exclusive 25% discount.'"),
        bullet("Survey to understand reasons for disengagement (pricing, experience, competition)."),
        bullet("Showcase new product categories or platform improvements since their last visit."),
        bullet("If no response after 90 days, remove from active CRM to reduce costs."),
        new Paragraph({ children: [new TextRun({ text: "KPIs: Reactivation Rate, Campaign ROI, Email Open Rate | Risk: High per-customer cost — prioritize highest-LTV churned customers.", italics: true, size: 20, color: "666666", font: "Arial" })], spacing: { after: 200 } }),
        pageBreak(),

        // ─── REFERENCES ──────────────────────────────────────────
        H1("References"),
        HR(),
        numbered("Scikit-learn: Machine Learning in Python. Pedregosa et al. (2011). JMLR 12, pp. 2825-2830. https://scikit-learn.org"),
        numbered("McInnes, L., Healy, J., Melville, J. (2018). UMAP: Uniform Manifold Approximation and Projection for Dimension Reduction. https://umap-learn.readthedocs.io"),
        numbered("Hughes, A. M. (1994). Strategic Database Marketing. Probus Publishing."),
        numbered("Rousseeuw, P. J. (1987). Silhouettes: A graphical aid to the interpretation and validation of cluster analysis. Journal of Computational and Applied Mathematics, 20, 53-65."),
        numbered("Ester, M., et al. (1996). A density-based algorithm for discovering clusters in large spatial databases with noise (DBSCAN). KDD, 96(34), 226-231."),
        numbered("Ward, J. H. (1963). Hierarchical grouping to optimize an objective function. JASA, 58(301), 236-244."),
        numbered("Von Luxburg, U., et al. (2010). Clustering: Science or Art? ICML Workshop on Unsupervised and Transfer Learning. (Source for bootstrap stability methodology.)"),
        numbered("NumPy, SciPy, Matplotlib, Seaborn — https://numpy.org, https://scipy.org, https://matplotlib.org, https://seaborn.pydata.org"),
        numbered("Project GitHub Repository: [Insert your repository URL]"),
        pageBreak(),

        // ─── APPENDIX ────────────────────────────────────────────
        H1("Appendix — Verification Instructions"),
        HR(),
        H2("A.1  Environment Setup"),
        P("Run the following commands in a terminal from the project root directory:"),
        new Paragraph({ children: [new TextRun({ text: "pip install -r requirements.txt\npython run_all.py", font: "Courier New", size: 20, color: "1E3A5F" })], spacing: { after: 200 }, shading: { fill: "F0F4F8", type: ShadingType.CLEAR } }),
        P("This will execute all 4 pipeline stages and regenerate every figure and CSV report under outputs/."),
        H2("A.2  Step-by-Step Verification"),
        numbered("Open data/transactions.csv — verify 7,636 rows and columns: customer_id, transaction_date, amount, category."),
        numbered("Open data/customer_features.csv — verify 800 rows and 12 columns including spend_cv, category_entropy, trend_score."),
        numbered("Open outputs/reports/cluster_metrics.csv — verify 3 rows (one per algorithm) with Silhouette, Davies-Bouldin, Calinski-Harabasz columns."),
        numbered("Open outputs/reports/stability_scores.csv — verify Bootstrap ARI values: K-Means ~0.906, Agglomerative ~0.628, DBSCAN ~0.971."),
        numbered("Open outputs/figures/radar_chart.png — verify 3 polygon overlays for the 3 segments."),
        numbered("Run python src/marketing_strategy.py — verify 5-segment strategy printout in console."),
        H2("A.3  Common Issues"),
        bullet("If UMAP fails: uninstall and reinstall with pip install umap-learn --break-system-packages. The code falls back to PCA automatically."),
        bullet("If figures are missing: re-run python src/clustering_analysis.py from the project root directory (not from src/)."),
        bullet("On Windows: replace python with python3 if the python command is not recognized."),
      ]
    }
  ]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("/mnt/user-data/outputs/ML_Course_Project_Report.docx", buffer);
  console.log("Report saved: ML_Course_Project_Report.docx");
}).catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
