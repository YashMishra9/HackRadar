function formatDeadline(iso) {
  if (!iso) return { text: "No deadline", cls: "normal" };
  const now = Date.now();
  const target = new Date(iso).getTime();
  const diffMs = target - now;

  if (diffMs <= 0) return { text: "Closed", cls: "normal" };

  const hours = diffMs / (1000 * 60 * 60);
  const days = Math.floor(hours / 24);
  const remHours = Math.floor(hours % 24);

  let text;
  let cls;
  if (hours < 24) {
    const h = Math.max(1, Math.floor(hours));
    const m = Math.floor((hours % 1) * 60);
    text = h >= 1 ? `Closes in ${h}h ${m}m` : `Closes in ${m}m`;
    cls = "urgent";
  } else if (days <= 2) {
    text = `Closes in ${days}d ${remHours}h`;
    cls = "urgent";
  } else if (days <= 7) {
    text = `Closes in ${days}d`;
    cls = "soon";
  } else {
    text = `Closes in ${days}d`;
    cls = "normal";
  }
  return { text, cls };
}

function formatDateRange(start, end) {
  const s = new Date(start);
  const e = new Date(end);
  const opts = { day: "numeric", month: "short" };
  if (s.toDateString() === e.toDateString()) {
    return s.toLocaleDateString("en-IN", opts);
  }
  return `${s.toLocaleDateString("en-IN", opts)} \u2013 ${e.toLocaleDateString("en-IN", { ...opts, year: undefined })}`;
}

function formatDateTime(iso) {
  if (!iso) return "TBA";
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatPrize(amount, currency = "₹") {
  if (!amount) return null;
  if (currency === "₹" && amount >= 100000) {
    const lakh = amount / 100000;
    return `₹${lakh % 1 === 0 ? lakh : lakh.toFixed(1)}L`;
  }
  return `${currency}${amount.toLocaleString("en-IN")}`;
}

function modeLabel(mode) {
  return { ONLINE: "Online", OFFLINE: "Offline", HYBRID: "Hybrid" }[mode] || mode;
}

function teamSizeLabel(min, max) {
  if (!min && !max) return "Any team size";
  if (min === max) return `Team of ${min}`;
  return `Team of ${min}\u2013${max}`;
}

function closingBucket(iso) {
  const now = new Date();
  const target = new Date(iso);
  const diffMs = target - now;
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours <= 24) return "Today";
  if (diffHours <= 48) return "Tomorrow";
  return "This week";
}
