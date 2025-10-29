import pptxgen from "pptxgenjs";
import { BenchmarkComparison, CalculatedFees, PlanFeeType } from "./types";

interface ExportOptions {
  benchmarks: BenchmarkComparison;
  existingFees: CalculatedFees;
  proposedFees?: CalculatedFees;
  aumBucket?: string;
  balanceBucket?: string;
  aum: number;
  viewMode: "basisPoints" | "dollars";
  feeType?: PlanFeeType;
}

/**
 * Export benchmark charts to PowerPoint
 */
export async function exportToPowerPoint(options: ExportOptions): Promise<void> {
  const { benchmarks, existingFees, proposedFees, aum, viewMode } = options;

  const pptx = new pptxgen();

  // Set presentation properties
  pptx.author = "Fiduciary Decisions Inc.";
  pptx.title = "Fee Benchmark Report";

  // Chart formatting options
  const chartColors = ["0078A2", "4FB3CD", "8EB935", "C2E76B"];
  const proposedColor = "F47D20";
  const disclaimer = "Data Source: NEPC Defined Contribution Plan & Fee Survey";

  // Slide 1: Fee Benchmark Comparison
  const benchmarkSlide = pptx.addSlide();

  benchmarkSlide.addText("Fee Benchmark Comparison", {
    x: 0.5, y: 0.3, w: 9, h: 0.5,
    fontSize: 24,
    bold: true,
    color: "003B5C",
  });

  // Prepare data for stacked bar chart
  const planTypes = ["Benchmark", "Existing"];
  if (proposedFees) planTypes.push("Proposed");

  const advisorData = [benchmarks.advisor.p50 * 10000, existingFees.advisor.percentage * 100];
  const recordKeeperData = [benchmarks.recordKeeper.p50 * 10000, existingFees.recordKeeper.percentage * 100];
  const investmentMenuData = [benchmarks.investmentMenu.p50 * 10000, existingFees.investmentMenu.percentage * 100];
  const tpaData = [benchmarks.tpa.p50 * 10000, existingFees.tpa.percentage * 100];

  if (proposedFees) {
    advisorData.push(proposedFees.advisor.percentage * 100);
    recordKeeperData.push(proposedFees.recordKeeper.percentage * 100);
    investmentMenuData.push(proposedFees.investmentMenu.percentage * 100);
    tpaData.push(proposedFees.tpa.percentage * 100);
  }

  const benchmarkChartData = [
    { name: "Advisor Fee", labels: planTypes, values: advisorData },
    { name: "Record Keeper Fee", labels: planTypes, values: recordKeeperData },
    { name: "Investment Menu Fee", labels: planTypes, values: investmentMenuData },
    { name: "TPA Fee", labels: planTypes, values: tpaData },
  ];

  benchmarkSlide.addChart(pptx.ChartType.bar, benchmarkChartData, {
    x: 0.5,
    y: 0.81,
    w: 9,
    h: 4.5,
    barDir: "bar",
    barGrouping: "stacked",
    chartColors: chartColors,
    showLegend: true,
    legendPos: "b",
    valAxisTitle: "Basis Points (bps)",
    catAxisTitle: "",
    showTitle: false,
    valAxisLabelColor: "003B5C",
    catAxisLabelColor: "003B5C",
    valAxisTitleColor: "003B5C",
    catAxisTitleColor: "003B5C",
    showValGridlines: true,
    valGridLine: { color: "D3D3D3", style: "solid", size: 1 },
    dataLabelColor: "003B5C",
  });

  benchmarkSlide.addText(disclaimer, {
    x: 0.5,
    y: 5.5,
    w: 9,
    fontSize: 10,
    italic: true,
    color: "666666",
  });

  // Helper function to create itemized fee slides
  const addItemizedSlide = (
    title: string,
    benchmarkData: { p25: number; p50: number; p75: number },
    existingFee: number,
    proposedFee: number | undefined
  ) => {
    const slide = pptx.addSlide();

    slide.addText(title, {
      x: 0.5,
      y: 0.3,
      fontSize: 24,
      bold: true,
      color: "003B5C",
    });

    const labels = ["25th Percentile", "50th Percentile", "75th Percentile", "Client Existing"];
    const values = [
      viewMode === "basisPoints" ? benchmarkData.p25 * 10000 : benchmarkData.p25 * aum,
      viewMode === "basisPoints" ? benchmarkData.p50 * 10000 : benchmarkData.p50 * aum,
      viewMode === "basisPoints" ? benchmarkData.p75 * 10000 : benchmarkData.p75 * aum,
      viewMode === "basisPoints" ? existingFee * 100 : (existingFee / 100) * aum,
    ];

    const colors = [...chartColors];

    if (proposedFee !== undefined) {
      labels.push("Client Proposed");
      values.push(viewMode === "basisPoints" ? proposedFee * 100 : (proposedFee / 100) * aum);
      colors.push(proposedColor);
    }

    const itemizedData = [{ name: "", labels: labels, values: values }];

    slide.addChart(pptx.ChartType.bar, itemizedData, {
      x: 0.5,
      y: 0.81,
      w: 9,
      h: 4.5,
      barDir: "col",
      chartColors: colors,
      showLegend: false,
      valAxisTitle: viewMode === "basisPoints" ? "Basis Points (bps)" : "Dollar Amount ($)",
      catAxisTitle: "",
      dataLabelFormatCode: viewMode === "basisPoints" ? "#" : "$#,##0",
      showTitle: false,
      valAxisLabelColor: "003B5C",
      catAxisLabelColor: "003B5C",
      valAxisTitleColor: "003B5C",
      catAxisTitleColor: "003B5C",
      showValGridlines: true,
      valGridLine: { color: "D3D3D3", style: "solid", size: 1 },
      dataLabelColor: "003B5C",
    });

    slide.addText(disclaimer, {
      x: 0.5,
      y: 5.5,
      w: 9,
      fontSize: 10,
      italic: true,
      color: "666666",
    });
  };

  // Create itemized slides
  addItemizedSlide("Advisor Fee", benchmarks.advisor, existingFees.advisor.percentage, proposedFees?.advisor.percentage);
  addItemizedSlide("Record Keeper Fee", benchmarks.recordKeeper, existingFees.recordKeeper.percentage, proposedFees?.recordKeeper.percentage);
  addItemizedSlide("Investment Menu Fee", benchmarks.investmentMenu, existingFees.investmentMenu.percentage, proposedFees?.investmentMenu.percentage);
  addItemizedSlide("TPA Fee", benchmarks.tpa, existingFees.tpa.percentage, proposedFees?.tpa.percentage);
  addItemizedSlide("Total Plan Fee", benchmarks.total, existingFees.total.percentage, proposedFees?.total.percentage);

  // Save the presentation
  const fileName = `Fee_Benchmark_Report_${new Date().toISOString().split('T')[0]}.pptx`;
  await pptx.writeFile({ fileName });
}
