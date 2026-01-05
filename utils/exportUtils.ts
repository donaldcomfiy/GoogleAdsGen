import { AdData, InputState } from "../types";

export const exportToCSV = (adData: AdData) => {
  // Define Google Ads Editor compatible CSV Headers for Responsive Search Ads
  const headers = [
    "Campaign",
    "Ad Group",
    "Ad type",
    "Final URL",
    "Path 1",
    "Path 2"
  ];

  // Add Headline Columns (1-15) and Position Columns
  for (let i = 1; i <= 15; i++) {
    headers.push(`Headline ${i}`);
    headers.push(`Headline ${i} Position`);
  }

  // Add Description Columns (1-4) and Position Columns
  for (let i = 1; i <= 4; i++) {
    headers.push(`Description ${i}`);
    headers.push(`Description ${i} Position`);
  }

  // Initialize Row Data with Default/Placeholder values
  const rowData: string[] = [
    "Draft Campaign", // Placeholder Campaign
    "Draft Ad Group", // Placeholder Ad Group
    "Responsive search ad",
    `"${adData.finalUrl || ""}"`,
    `"${adData.displayPath1 || ""}"`,
    `"${adData.displayPath2 || ""}"`
  ];

  // Process Headlines (Max 15 for RSA)
  for (let i = 0; i < 15; i++) {
    const h = adData.headlines[i];
    if (h && h.text.trim()) {
        // Text
        rowData.push(`"${h.text.replace(/"/g, '""')}"`);
        
        // Position Mapping (1 -> "Headline 1")
        let pin = "";
        if (h.pinnedPosition === 1) pin = "Headline 1";
        else if (h.pinnedPosition === 2) pin = "Headline 2";
        else if (h.pinnedPosition === 3) pin = "Headline 3";
        
        rowData.push(pin);
    } else {
        rowData.push(""); // Empty Text
        rowData.push(""); // Empty Position
    }
  }

  // Process Descriptions (Max 4 for RSA)
  for (let i = 0; i < 4; i++) {
    const d = adData.descriptions[i];
    if (d && d.text.trim()) {
        // Text
        rowData.push(`"${d.text.replace(/"/g, '""')}"`);
        // Description Position (Currently app doesn't support pinning descriptions in UI, but format supports it)
        rowData.push(""); 
    } else {
        rowData.push("");
        rowData.push("");
    }
  }

  // Combine Headers and Row
  const csvContent = [
    headers.join(","),
    rowData.join(",")
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `google_ads_editor_import_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportProjectFile = (adData: AdData, inputState: InputState) => {
  const projectData = {
    version: '1.0',
    timestamp: new Date().toISOString(),
    adData,
    inputState
  };

  const jsonContent = JSON.stringify(projectData, null, 2);
  const blob = new Blob([jsonContent], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `ads_project_${new Date().toISOString().slice(0,19).replace(/:/g, "-")}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};