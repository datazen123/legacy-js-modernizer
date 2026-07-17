const RISK_ORDER = { high: 0, medium: 1, low: 2 };

function daysBetween(d1, d2) {
  const oneDay = 1000 * 60 * 60 * 24;
  const date1 = new Date(d1);
  const date2 = new Date(d2);
  return Math.round(Math.abs((date2.getTime() - date1.getTime()) / oneDay));
}

function calculateRiskLevel(asset) {
  const days = daysBetween(asset.last_checked, new Date().toISOString());
  const overdue = days > asset.check_interval_days;
  const ratio = days / asset.check_interval_days;
  
  let risk;
  if (ratio >= 2) {
    risk = "high";
  } else if (ratio >= 1) {
    risk = "medium";
  } else {
    risk = "low";
  }
  
  if (asset.condition_notes && asset.condition_notes.toLowerCase().indexOf("fail") !== -1) {
    risk = "high";
  }
  
  return { days, overdue, risk };
}

function processAssets(assets) {
  const processed = assets.map(asset => {
    const riskData = calculateRiskLevel(asset);
    return {
      ...asset,
      daysSinceCheck: riskData.days,
      isOverdue: riskData.overdue,
      riskLevel: riskData.risk
    };
  });
  
  processed.sort((a, b) => {
    return RISK_ORDER[a.riskLevel] - RISK_ORDER[b.riskLevel];
  });
  
  return processed;
}

module.exports = { processAssets };
