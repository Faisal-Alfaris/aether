"use client";

import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Bell,
  Boxes,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  Code2,
  Container,
  Cpu,
  Database,
  FileCheck2,
  FileSliders,
  Gauge,
  GitBranch,
  Globe2,
  HardDrive,
  Layers3,
  LockKeyhole,
  MemoryStick,
  Network,
  Plus,
  Search,
  Server,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  TerminalSquare,
  Users,
  Workflow,
  X,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type PageId =
  | "overview"
  | "infrastructure"
  | "topology"
  | "workloads"
  | "request"
  | "results"
  | "approvals"
  | "policies"
  | "kubernetes"
  | "audit";

type ApprovalState = "draft" | "pending" | "approved" | "rejected" | "deploying" | "running";
type EnvironmentStatus = "Available" | "Near capacity" | "Restricted" | "Offline";

type Environment = {
  name: string;
  cluster: string;
  owner: string;
  location: string;
  cpu: number;
  gpu: number;
  memory: number;
  storage: number;
  status: EnvironmentStatus;
  classification: string;
  shareable: string;
  reserved: string;
  kubernetes: string;
};

const environments: Environment[] = [
  { name: "Prince Sultan Institute", cluster: "PSI-GPU-01", owner: "Applied Research Operations", location: "Riyadh · DC-02", cpu: 42, gpu: 35, memory: 48, storage: 46, status: "Available", classification: "Public · Internal", shareable: "2 NVIDIA A100 · 1.8 TB RAM", reserved: "20%", kubernetes: "v1.31 · Healthy" },
  { name: "Central Data Center", cluster: "KSU-CORE-01", owner: "Central IT", location: "Riyadh · DC-01", cpu: 58, gpu: 62, memory: 67, storage: 54, status: "Available", classification: "Up to Confidential", shareable: "128 vCPU · 1.2 TB", reserved: "25%", kubernetes: "v1.30 · Healthy" },
  { name: "College of Computer Science", cluster: "CCIS-CLUSTER", owner: "CCIS Infrastructure", location: "Riyadh · Campus North", cpu: 88, gpu: 100, memory: 82, storage: 78, status: "Near capacity", classification: "Up to Internal", shareable: "12 vCPU · No GPU", reserved: "15%", kubernetes: "v1.30 · Healthy" },
  { name: "AI Research Center", cluster: "AI-LAB", owner: "Research Computing", location: "Riyadh · Research Park", cpu: 51, gpu: 72, memory: 59, storage: 63, status: "Restricted", classification: "Internal · Confidential", shareable: "1 NVIDIA L40S · 620 GB", reserved: "30%", kubernetes: "v1.29 · Healthy" },
  { name: "Engineering College", cluster: "ENG-COMPUTE", owner: "Engineering IT", location: "Riyadh · Campus East", cpu: 64, gpu: 44, memory: 61, storage: 57, status: "Restricted", classification: "Department only", shareable: "48 vCPU · 512 GB", reserved: "20%", kubernetes: "v1.28 · Upgrade due" },
  { name: "Cloud Environment", cluster: "KSU-CLOUD-01", owner: "Cloud Center of Excellence", location: "Saudi Arabia · Central", cpu: 38, gpu: 18, memory: 41, storage: 33, status: "Available", classification: "Public · Internal", shareable: "Elastic · quota governed", reserved: "10%", kubernetes: "v1.31 · Healthy" },
];

const workloads = [
  ["Vision Model Training", "College of Computer Science", "Internal", "CCIS-CLUSTER", "8", "1× A100", "100 GB", "Pending placement", "—"],
  ["Student Portal", "Central IT", "Internal", "KSU-CORE-01", "12", "—", "240 GB", "Running", "91%"],
  ["Analytics Pipeline", "AI Research Center", "Confidential", "KSU-CORE-01", "16", "—", "1.8 TB", "Running", "89%"],
  ["Research Dataset Processing", "Research Computing", "Internal", "AI-LAB", "24", "2× L40S", "3.2 TB", "Needs approval", "86%"],
  ["Internal API", "Engineering College", "Internal", "ENG-COMPUTE", "4", "—", "40 GB", "Running", "82%"],
  ["Database Replication", "Central IT", "Restricted", "—", "8", "—", "4.0 TB", "Blocked", "—"],
];

const initialAudit = [
  { time: "14:32:08", actor: "AETHER Engine", action: "Placement evaluated", target: "Analytics Pipeline → KSU-CORE-01", outcome: "Eligible · 89%" },
  { time: "14:28:41", actor: "Sara Al-Harbi", action: "Owner approval granted", target: "Research Dataset Processing", outcome: "Approved" },
  { time: "14:21:19", actor: "Kubernetes Connector", action: "Deployment reconciled", target: "student-portal-v42", outcome: "Running" },
  { time: "14:08:53", actor: "AETHER Engine", action: "Placement blocked", target: "Database Replication → ENG-COMPUTE", outcome: "Classification mismatch" },
  { time: "13:56:14", actor: "Discovery Agent", action: "Capacity synchronized", target: "PSI-GPU-01", outcome: "Healthy" },
];

const nav: { label: string; id: PageId; icon: LucideIcon; badge?: string }[] = [
  { label: "Overview", id: "overview", icon: Gauge },
  { label: "Infrastructure", id: "infrastructure", icon: Server },
  { label: "Topology", id: "topology", icon: GitBranch },
  { label: "Workloads", id: "workloads", icon: Boxes },
  { label: "Approvals", id: "approvals", icon: FileCheck2, badge: "1" },
  { label: "Policies", id: "policies", icon: FileSliders },
  { label: "Kubernetes", id: "kubernetes", icon: Container },
  { label: "Audit log", id: "audit", icon: Activity },
];

const processSteps = [
  "Checking available capacity",
  "Evaluating data classification",
  "Verifying residency constraints",
  "Intersecting owner policies",
  "Testing technical compatibility",
  "Ranking eligible environments",
];

function StatusDot({ tone = "green" }: { tone?: "green" | "amber" | "red" | "blue" }) {
  return <span className={`status-dot ${tone}`} />;
}

function Pill({ children, tone = "neutral" }: { children: React.ReactNode; tone?: string }) {
  return <span className={`pill ${tone}`}>{children}</span>;
}

function Bar({ value, tone }: { value: number; tone?: string }) {
  return <span className="bar"><span className={tone ?? (value > 84 ? "danger" : value > 69 ? "warning" : "")} style={{ width: `${value}%` }} /></span>;
}

function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return (
    <header className="page-header">
      <div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>
      {action}
    </header>
  );
}

function MetricCard({ label, value, detail, icon: Icon, tone }: { label: string; value: string; detail: string; icon: LucideIcon; tone?: string }) {
  return (
    <article className="metric-card">
      <div className="metric-top"><span>{label}</span><Icon size={16} /></div>
      <strong className={tone}>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

function Overview({ navigate }: { navigate: (id: PageId) => void }) {
  return (
    <div className="view-enter">
      <PageHeader eyebrow="INFRASTRUCTURE INTELLIGENCE" title="Capacity, governed." description="A unified decision layer across King Saud University infrastructure." action={<button className="primary-button" onClick={() => navigate("request")}><Plus size={16} /> New placement</button>} />

      <section className="hero-grid">
        <article className="capacity-hero panel">
          <div className="hero-copy">
            <span className="panel-kicker"><StatusDot /> CAPACITY DISCOVERED BY AETHER</span>
            <div className="hero-number">39<span>%</span></div>
            <h2>Available infrastructure capacity</h2>
            <p>Across approved, connected environments after owner reservations and policy constraints.</p>
            <button className="text-button" onClick={() => navigate("infrastructure")}>Explore available capacity <ArrowRight size={15} /></button>
          </div>
          <div className="capacity-ring" aria-label="39 percent available capacity"><div><b>61%</b><span>utilized</span></div></div>
        </article>

        <article className="recoverable-card panel">
          <div className="panel-kicker">POTENTIAL INFRASTRUCTURE AVOIDED</div>
          <div className="currency-value"><span>SAR</span> 2.7B</div>
          <p>Estimated recoverable capacity equivalent based on current demand and approved sharing pools.</p>
          <div className="signal-line"><span>Confidence model</span><b>High · 92%</b></div>
          <div className="mini-bars">{[34, 48, 43, 57, 64, 59, 71, 68, 76, 83, 88, 92].map((h, i) => <i key={i} style={{ height: `${h}%` }} />)}</div>
        </article>
      </section>

      <section className="metric-grid">
        <MetricCard label="Connected environments" value="12" detail="10 healthy · 2 attention" icon={Network} />
        <MetricCard label="Eligible shared capacity" value="28%" detail="+4.2% this quarter" icon={Layers3} tone="green-text" />
        <MetricCard label="Policy compliance" value="98.6%" detail="3,842 controls evaluated" icon={ShieldCheck} />
        <MetricCard label="Workloads placed" value="142" detail="26 matched automatically" icon={Workflow} />
      </section>

      <section className="dashboard-grid">
        <article className="panel utilization-panel">
          <div className="panel-heading"><div><span className="panel-kicker">INFRASTRUCTURE OVERVIEW</span><h3>Utilization by resource</h3></div><button className="icon-button" aria-label="More utilization settings"><SlidersHorizontal size={16} /></button></div>
          {[
            ["CPU", "7,824 cores", 61, Cpu],
            ["GPU", "126 accelerators", 54, CircuitIcon],
            ["Memory", "18.4 TB", 67, MemoryStick],
            ["Storage", "9.7 PB", 58, HardDrive],
          ].map(([name, total, value, Icon]) => (
            <div className="resource-row" key={String(name)}>
              <span className="resource-icon"><Icon size={16} /></span>
              <div><b>{name as string}</b><small>{total as string}</small></div>
              <Bar value={value as number} />
              <strong>{value as number}%</strong>
            </div>
          ))}
        </article>

        <article className="panel health-panel">
          <div className="panel-heading"><div><span className="panel-kicker">ENVIRONMENT HEALTH</span><h3>12 connected</h3></div><button className="text-button" onClick={() => navigate("topology")}>View topology <ArrowUpRight size={14} /></button></div>
          <div className="health-strip"><span className="healthy" style={{ flex: 8 }} /><span className="warning" style={{ flex: 2 }} /><span className="restricted" style={{ flex: 1 }} /><span className="offline" style={{ flex: 1 }} /></div>
          <div className="health-legend"><span><StatusDot /> Healthy <b>8</b></span><span><StatusDot tone="amber" /> Attention <b>2</b></span><span><StatusDot tone="blue" /> Restricted <b>1</b></span><span><StatusDot tone="red" /> Offline <b>1</b></span></div>
          <div className="health-note"><Sparkles size={16} /><div><b>28% more capacity is eligible today</b><span>Owner policies unlocked 184 additional GPU hours.</span></div></div>
        </article>
      </section>

      <section className="panel decisions-panel">
        <div className="panel-heading"><div><span className="panel-kicker">RECENT PLACEMENT DECISIONS</span><h3>Explainable by default</h3></div><button className="text-button" onClick={() => navigate("audit")}>View audit log <ArrowRight size={14} /></button></div>
        <div className="decision-table">
          <div className="decision-row table-head"><span>Workload</span><span>Destination</span><span>Policy signal</span><span>Decision</span></div>
          <div className="decision-row"><span><b>Vision Model Training</b><small>College of Computer Science</small></span><span>Prince Sultan Institute</span><span><Pill tone="green">7/7 passed</Pill></span><span><b className="score">94%</b> <small>Awaiting approval</small></span></div>
          <div className="decision-row"><span><b>Analytics Pipeline</b><small>AI Research Center</small></span><span>Central Data Center</span><span><Pill tone="green">7/7 passed</Pill></span><span><b className="score">89%</b> <small>Running</small></span></div>
          <div className="decision-row"><span><b>Database Replication</b><small>Central IT</small></span><span>Engineering Cluster</span><span><Pill tone="red">Classification</Pill></span><span><b className="blocked-text">BLOCKED</b><small>Hard constraint</small></span></div>
        </div>
      </section>
    </div>
  );
}

function CircuitIcon({ size = 16 }: { size?: number }) { return <Zap size={size} />; }

function Infrastructure() {
  const [filter, setFilter] = useState("All");
  const filtered = environments.filter((environment) => filter === "All" || environment.status === filter);
  return (
    <div className="view-enter">
      <PageHeader eyebrow="FEDERATED INVENTORY" title="Infrastructure" description="Capacity metadata shared by resource owners—never tenant data." action={<button className="secondary-button"><Plus size={16} /> Connect environment</button>} />
      <div className="toolbar">
        <div className="filter-tabs">{["All", "Available", "Near capacity", "Restricted", "Offline"].map((item) => <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>{item}{item === "All" && <em>12</em>}</button>)}</div>
        <button className="icon-button" aria-label="Filter environments"><SlidersHorizontal size={16} /></button>
      </div>
      <div className="environment-grid">
        {filtered.map((environment) => <EnvironmentCard key={environment.cluster} environment={environment} />)}
        {filtered.length === 0 && <div className="empty-state"><Server size={28} /><b>No offline environments</b><span>Every connected agent is currently responding.</span></div>}
      </div>
    </div>
  );
}

function EnvironmentCard({ environment }: { environment: Environment }) {
  const tone = environment.status === "Near capacity" ? "amber" : environment.status === "Restricted" ? "blue" : environment.status === "Offline" ? "red" : "green";
  return (
    <article className="environment-card panel">
      <div className="environment-top">
        <div className="cluster-mark"><Server size={18} /></div>
        <div><h3>{environment.name}</h3><code>{environment.cluster}</code></div>
        <Pill tone={tone}><StatusDot tone={tone as "green" | "amber" | "red" | "blue"} />{environment.status}</Pill>
      </div>
      <div className="env-location"><span><Globe2 size={13} />{environment.location}</span><span><Users size={13} />{environment.owner}</span></div>
      <div className="env-metrics">
        {[["CPU", environment.cpu], ["GPU", environment.gpu], ["Memory", environment.memory], ["Storage", environment.storage]].map(([label, value]) => <div key={String(label)}><span><b>{label}</b><em>{value}%</em></span><Bar value={value as number} /></div>)}
      </div>
      <div className="env-policy-grid">
        <div><span>Classification</span><b>{environment.classification}</b></div>
        <div><span>Shareable pool</span><b>{environment.shareable}</b></div>
        <div><span>Reserved floor</span><b>{environment.reserved}</b></div>
        <div><span>Kubernetes</span><b>{environment.kubernetes}</b></div>
      </div>
      <button className="card-link">Inspect environment <ChevronRight size={15} /></button>
    </article>
  );
}

function Topology() {
  const nodes = [
    ["KSU-CORE-01", "Central IT", "healthy", "58%"],
    ["PSI-GPU-01", "Prince Sultan Institute", "healthy", "42%"],
    ["CCIS-CLUSTER", "Computer Science", "warning", "88%"],
    ["ENG-COMPUTE", "Engineering College", "restricted", "64%"],
    ["AI-LAB", "AI Research Center", "restricted", "51%"],
    ["KSU-CLOUD-01", "Saudi Cloud", "healthy", "38%"],
  ];
  return (
    <div className="view-enter">
      <PageHeader eyebrow="CONTROL PLANE" title="Organization topology" description="One policy plane, six independently governed execution environments." action={<div className="live-chip"><StatusDot /> Live metadata · 18s ago</div>} />
      <div className="topology-canvas panel">
        <div className="topology-header"><span>King Saud University</span><div><span><StatusDot /> Healthy</span><span><StatusDot tone="amber" /> Near capacity</span><span><StatusDot tone="blue" /> Restricted</span></div></div>
        <div className="topology-grid">
          {nodes.slice(0, 3).map((n) => <TopologyNode node={n} key={n[0]} />)}
          <div className="aether-node"><div className="aether-symbol"><Sparkles size={21} /></div><span>AETHER</span><b>Policy & placement control plane</b><small>3,842 constraints evaluated today</small></div>
          {nodes.slice(3).map((n) => <TopologyNode node={n} key={n[0]} />)}
        </div>
        <div className="topology-footer"><span><LockKeyhole size={14} /> Metadata-only discovery</span><span><ShieldCheck size={14} /> Federated ownership preserved</span><span><Network size={14} /> mTLS agent channels</span></div>
      </div>
    </div>
  );
}

function TopologyNode({ node }: { node: string[] }) {
  const tone = node[2] === "warning" ? "amber" : node[2] === "restricted" ? "blue" : "green";
  return <div className={`topology-node ${node[2]}`}><div><Server size={16} /><StatusDot tone={tone as "green" | "amber" | "blue"} /></div><code>{node[0]}</code><b>{node[1]}</b><small><span>{node[3]} utilized</span><span>Agent online</span></small></div>;
}

function Workloads({ navigate }: { navigate: (id: PageId) => void }) {
  return (
    <div className="view-enter">
      <PageHeader eyebrow="PORTABLE WORKLOADS" title="Workloads" description="Placement state across Kubernetes and selected portable workloads." action={<button className="primary-button" onClick={() => navigate("request")}><Plus size={16} /> New placement</button>} />
      <div className="table-toolbar"><label className="search-field"><Search size={15} /><input placeholder="Search workloads" aria-label="Search workloads" /></label><button className="secondary-button"><SlidersHorizontal size={15} /> Filter</button></div>
      <div className="data-table panel workloads-table">
        <div className="workload-row table-head">{["Workload", "Owner", "Class", "Environment", "CPU", "GPU", "Storage", "Status", "Score"].map((h) => <span key={h}>{h}</span>)}</div>
        {workloads.map((row) => <div className="workload-row" key={row[0]}>{row.map((cell, index) => <span key={index}>{index === 0 ? <><b>{cell}</b><small>{index === 0 ? "Kubernetes" : ""}</small></> : index === 7 ? <Pill tone={cell === "Running" ? "green" : cell === "Blocked" ? "red" : cell === "Needs approval" ? "amber" : "blue"}>{cell}</Pill> : index === 8 && cell !== "—" ? <b className="score">{cell}</b> : cell}</span>)}</div>)}
      </div>
    </div>
  );
}

function PlacementRequest({ navigate, runEngine }: { navigate: (id: PageId) => void; runEngine: () => void }) {
  const [step, setStep] = useState(1);
  const next = () => setStep((current) => Math.min(4, current + 1));
  const back = () => setStep((current) => Math.max(1, current - 1));
  return (
    <div className="request-page view-enter">
      <button className="back-link" onClick={() => navigate("workloads")}><ChevronLeft size={15} /> Back to workloads</button>
      <div className="request-shell">
        <aside className="request-intro">
          <span className="panel-kicker">NEW PLACEMENT REQUEST</span><h1>Define the workload.<br />AETHER finds the fit.</h1><p>Hard policy constraints determine eligibility. Optimization begins only after every required control passes.</p>
          <div className="request-steps">
            {["Workload", "Resources", "Policy requirements", "Review & run"].map((label, i) => <button key={label} className={step === i + 1 ? "active" : step > i + 1 ? "complete" : ""} onClick={() => setStep(i + 1)}><span>{step > i + 1 ? <Check size={14} /> : `0${i + 1}`}</span><div><b>{label}</b><small>{["Identity and ownership", "Minimum capacity", "Governance constraints", "Placement engine"][i]}</small></div></button>)}
          </div>
          <div className="principle-card"><LockKeyhole size={17} /><div><b>Share capacity, not data.</b><span>AETHER places isolated workloads without exposing owner data.</span></div></div>
        </aside>
        <section className="request-form panel">
          <div className="form-heading"><span>STEP 0{step} OF 04</span><h2>{["Describe the workload", "Set minimum resources", "Define policy requirements", "Review placement input"][step - 1]}</h2><p>{["Tell AETHER what is being placed and who owns it.", "These are hard minimums—not optimization targets.", "A destination must satisfy every selected constraint.", "Confirm the immutable requirement snapshot before evaluation."][step - 1]}</p></div>
          {step === 1 && <div className="form-grid"><Field label="Workload name"><input defaultValue="Vision Model Training" /></Field><Field label="Application type"><Select value="AI / ML workload" /></Field><Field label="Owner"><Select value="Maha Al-Qahtani" /></Field><Field label="Department"><Select value="College of Computer Science" /></Field><Field label="Runtime" wide><div className="choice-row"><Choice active icon={Container} label="Kubernetes" detail="Container workload" /><Choice icon={Server} label="Virtual machine" detail="Selected VM image" /><Choice icon={Database} label="Data service" detail="Discovery only" disabled /></div></Field></div>}
          {step === 2 && <div className="form-grid resource-form"><Field label="CPU"><UnitInput value="8" unit="vCPU" /></Field><Field label="Memory"><UnitInput value="32" unit="GB" /></Field><Field label="GPU"><UnitInput value="1" unit="NVIDIA" /></Field><Field label="Persistent storage"><UnitInput value="100" unit="GB" /></Field><Field label="GPU architecture" wide><Select value="NVIDIA CUDA compatible" /></Field><div className="capacity-notice"><Gauge size={17} /><div><b>Reserved capacity remains protected</b><span>AETHER evaluates these requirements against shareable capacity after each owner’s reserved floor.</span></div></div></div>}
          {step === 3 && <div className="form-grid"><Field label="Data classification"><Select value="Internal" /></Field><Field label="Residency"><Select value="Saudi Arabia" /></Field><Field label="Network zone"><Select value="Internal" /></Field><Field label="Encryption"><Select value="Required at rest & in transit" /></Field><Field label="Technical requirements" wide><div className="check-grid"><CheckItem label="Kubernetes compatible" /><CheckItem label="NVIDIA GPU required" /><CheckItem label="Persistent volume" /><CheckItem label="Outbound internet not required" /></div></Field></div>}
          {step === 4 && <ReviewSummary />}
          <div className="form-actions"><button className="secondary-button" onClick={back} disabled={step === 1}>Back</button>{step < 4 ? <button className="primary-button" onClick={next}>Continue <ArrowRight size={15} /></button> : <button className="primary-button engine-button" onClick={runEngine}><Sparkles size={16} /> Run placement engine</button>}</div>
        </section>
      </div>
    </div>
  );
}

function Field({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) { return <label className={`field ${wide ? "wide" : ""}`}><span>{label}</span>{children}</label>; }
function Select({ value }: { value: string }) { return <button className="select-control" type="button"><span>{value}</span><ChevronDown size={15} /></button>; }
function UnitInput({ value, unit }: { value: string; unit: string }) { return <div className="unit-input"><input defaultValue={value} /><span>{unit}</span></div>; }
function Choice({ active, icon: Icon, label, detail, disabled }: { active?: boolean; icon: LucideIcon; label: string; detail: string; disabled?: boolean }) { return <button type="button" className={`choice ${active ? "active" : ""}`} disabled={disabled}><Icon size={18} /><b>{label}</b><span>{detail}</span>{active && <CheckCircle2 size={15} />}</button>; }
function CheckItem({ label }: { label: string }) { return <label className="check-item"><span><Check size={12} /></span>{label}</label>; }

function ReviewSummary() {
  const groups = [
    ["WORKLOAD", [["Name", "Vision Model Training"], ["Owner", "College of Computer Science"], ["Runtime", "Kubernetes"]]],
    ["RESOURCES", [["CPU", "8 vCPU"], ["Memory", "32 GB"], ["GPU", "1 × NVIDIA"], ["Storage", "100 GB"]]],
    ["POLICY", [["Classification", "Internal"], ["Residency", "Saudi Arabia"], ["Network", "Internal"], ["Encryption", "Required"]]],
  ];
  return <div className="review-summary">{groups.map(([label, rows]) => <section key={label as string}><span className="panel-kicker">{label as string}</span>{(rows as string[][]).map(([k, v]) => <div key={k}><span>{k}</span><b>{v}</b></div>)}</section>)}<div className="immutable-note"><ShieldCheck size={17} /><div><b>Requirements become an immutable decision record</b><span>Every check, score, approval, and deployment action will be traceable.</span></div></div></div>;
}

function PlacementResults({ status, processIndex, requestApproval, navigate }: { status: string; processIndex: number; requestApproval: () => void; navigate: (id: PageId) => void }) {
  if (status === "running") return <ProcessingState index={processIndex} />;
  const checks = [
    ["Capacity", "8 CPU · 32 GB · 1 A100 available"],
    ["Classification", "Internal workloads permitted"],
    ["Residency", "Riyadh, Saudi Arabia"],
    ["GPU compatibility", "NVIDIA A100 · CUDA 12"],
    ["Network policy", "Internal zone available"],
    ["Owner policy", "KSU internal departments allowed"],
    ["Storage", "2.4 TB shareable after reserve"],
  ];
  return (
    <div className="view-enter results-page">
      <button className="back-link" onClick={() => navigate("request")}><ChevronLeft size={15} /> Edit requirements</button>
      <PageHeader eyebrow="PLACEMENT DECISION · PL-2026-0148" title="A destination is eligible." description="3 of 6 environments passed every hard constraint. Ranked by best fit." />
      <div className="result-grid">
        <article className="best-match panel">
          <div className="best-banner"><span><Sparkles size={14} /> BEST MATCH</span><Pill tone="green"><StatusDot /> ELIGIBLE</Pill></div>
          <div className="match-heading"><div className="cluster-mark large"><Server size={21} /></div><div><h2>Prince Sultan Institute</h2><code>PSI-GPU-01 · Riyadh, Saudi Arabia</code></div><div className="match-score"><strong>94</strong><span>% MATCH</span></div></div>
          <div className="score-composition"><span style={{ flex: 30 }}>Capacity</span><span style={{ flex: 25 }}>Technical</span><span style={{ flex: 20 }}>Policy</span><span style={{ flex: 15 }}>Efficiency</span><span style={{ flex: 10 }}>Latency</span></div>
          <div className="score-legend"><span>30 Capacity</span><span>24 Technical</span><span>20 Policy</span><span>12 Efficiency</span><span>8 Latency</span></div>
          <div className="decision-reason"><Sparkles size={17} /><p><b>Why this environment</b>Strongest eligible NVIDIA fit with 65% GPU headroom, Saudi residency, and explicit cross-department sharing. A 20% owner reserve remains protected after placement.</p></div>
          <div className="check-list">{checks.map(([label, detail]) => <div key={label}><Check size={14} /><span><b>{label}</b><small>{detail}</small></span><em>PASS</em></div>)}</div>
          <div className="result-actions"><button className="secondary-button">Export decision</button><button className="primary-button" onClick={requestApproval}>Request approval <ArrowRight size={15} /></button></div>
        </article>
        <aside className="alternative-column">
          <div className="policy-intersection panel"><div className="panel-heading"><div><span className="panel-kicker">TWO-SIDED AUTHORIZATION</span><h3>Policy intersection</h3></div><Pill tone="green">ELIGIBLE</Pill></div><div className="intersection-diagram"><div><Users size={17} /><span>Workload owner</span><b>4 requirements</b></div><span className="intersection-mark"><Check size={18} /></span><div><Server size={17} /><span>Resource owner</span><b>5 permissions</b></div></div><p>Both policy sets intersect within organization guardrails.</p></div>
          <div className="alternatives panel"><span className="panel-kicker">ALTERNATIVES</span><Alternative name="Central Data Center" cluster="KSU-CORE-01" score="87%" note="Higher latency · no dedicated GPU pool" /><Alternative name="AI Research Center" cluster="AI-LAB" score="73%" note="Lower GPU headroom · manual security review" /><Alternative name="Engineering College" cluster="ENG-COMPUTE" blocked note="External departments are not permitted by the resource owner." /></div>
        </aside>
      </div>
    </div>
  );
}

function ProcessingState({ index }: { index: number }) {
  return <div className="processing-page view-enter"><div className="engine-orb"><Sparkles size={24} /></div><span className="panel-kicker">AETHER PLACEMENT ENGINE</span><h1>Evaluating six environments</h1><p>Applying hard constraints before optimization. No score can override policy.</p><div className="processing-list">{processSteps.map((step, i) => <div key={step} className={i < index ? "done" : i === index ? "active" : ""}><span>{i < index ? <Check size={14} /> : i === index ? <span className="spinner" /> : `0${i + 1}`}</span><b>{step}</b><em>{i < index ? "Passed" : i === index ? "Evaluating" : "Queued"}</em></div>)}</div><small className="decision-id">Decision ID · PL-2026-0148</small></div>;
}

function Alternative({ name, cluster, score, note, blocked }: { name: string; cluster: string; score?: string; note: string; blocked?: boolean }) {
  return <div className={`alternative ${blocked ? "is-blocked" : ""}`}><div><b>{name}</b><code>{cluster}</code></div>{blocked ? <Pill tone="red">BLOCKED</Pill> : <strong>{score}</strong>}<p>{blocked && <AlertTriangle size={13} />}{note}</p><button aria-label={`Inspect ${name}`}><ChevronRight size={15} /></button></div>;
}

function Approvals({ approval, approve, reject, deploy }: { approval: ApprovalState; approve: () => void; reject: () => void; deploy: () => void }) {
  const resourceApproved = ["approved", "deploying", "running"].includes(approval);
  return (
    <div className="view-enter">
      <PageHeader eyebrow="AUTHORIZATION GATES" title="Approval center" description="Execution remains locked until both independent owners authorize placement." action={<Pill tone={resourceApproved ? "green" : "amber"}>{resourceApproved ? "2 OF 2 APPROVED" : "1 PENDING"}</Pill>} />
      <div className="approval-layout">
        <article className="approval-request panel">
          <div className="request-id-row"><span>REQUEST · PL-2026-0148</span><Pill tone={approval === "rejected" ? "red" : resourceApproved ? "green" : "amber"}>{approval === "rejected" ? "REJECTED" : approval === "running" ? "RUNNING" : resourceApproved ? "APPROVED" : "AWAITING OWNER"}</Pill></div>
          <div className="approval-route"><div><span>FROM</span><b>College of Computer Science</b><small>Workload & data owner</small></div><ArrowRight size={21} /><div><span>TO</span><b>Prince Sultan Institute</b><small>Infrastructure owner</small></div></div>
          <div className="approval-workload"><div className="cluster-mark"><Boxes size={18} /></div><div><span>WORKLOAD</span><h3>Vision Model Training</h3><small>Kubernetes · Internal · Saudi Arabia</small></div><div className="compact-score"><b>94%</b><span>AETHER SCORE</span></div></div>
          <div className="requested-resources">{[[Cpu, "8", "vCPU"], [MemoryStick, "32", "GB RAM"], [Zap, "1", "NVIDIA GPU"], [HardDrive, "100", "GB STORAGE"]].map(([Icon, value, label]) => <div key={label as string}><Icon size={15} /><b>{value as string}</b><span>{label as string}</span></div>)}</div>
          <div className="approval-reason"><span>REQUEST REASON</span><p>Train a computer vision model against an owner-controlled, encrypted dataset mounted into an isolated namespace. No data is exposed to the host department.</p></div>
        </article>
        <aside className="approval-gates panel">
          <span className="panel-kicker">DUAL AUTHORIZATION</span><h3>Both gates are mandatory</h3>
          <ApprovalGate icon={Users} title="Data owner approval" owner="Maha Al-Qahtani · CCIS" approved />
          <div className="gate-link" />
          <ApprovalGate icon={Server} title="Infrastructure owner approval" owner="Omar Al-Rashid · PSI" approved={resourceApproved} rejected={approval === "rejected"} />
          {approval === "pending" && <div className="approval-buttons"><button className="reject-button" onClick={reject}><X size={15} /> Reject</button><button className="primary-button" onClick={approve}><Check size={15} /> Approve placement</button></div>}
          {approval === "rejected" && <div className="locked-notice red"><LockKeyhole size={16} /><span>Deployment blocked by infrastructure owner.</span></div>}
          {resourceApproved && <div className="deployment-unlocked"><CheckCircle2 size={18} /><div><b>Execution unlocked</b><span>Both independent owner gates are approved.</span></div></div>}
          {resourceApproved && <button className="primary-button deploy-button" onClick={deploy} disabled={approval !== "approved"}>{approval === "deploying" ? <><span className="spinner" /> Deploying workload</> : approval === "running" ? <><Check size={16} /> Workload running</> : <><Container size={16} /> Deploy to Kubernetes</>}</button>}
        </aside>
      </div>
      {approval === "running" && <div className="deployment-success panel"><div className="success-pulse"><Check size={17} /></div><div><span>DEPLOYMENT RUNNING</span><h3>vision-model-training-7d4c9</h3><p>Namespace <code>college-a</code> · 1/1 pod ready · PSI-GPU-01</p></div><button className="secondary-button">Open deployment <ArrowUpRight size={14} /></button></div>}
    </div>
  );
}

function ApprovalGate({ icon: Icon, title, owner, approved, rejected }: { icon: LucideIcon; title: string; owner: string; approved?: boolean; rejected?: boolean }) { return <div className={`approval-gate ${approved ? "approved" : rejected ? "rejected" : "pending"}`}><span className="gate-icon"><Icon size={17} /></span><div><b>{title}</b><small>{owner}</small></div><Pill tone={approved ? "green" : rejected ? "red" : "amber"}>{approved ? "APPROVED" : rejected ? "REJECTED" : "PENDING"}</Pill></div>; }

function Policies() {
  const [enabled, setEnabled] = useState<Record<string, boolean>>({ "POL-001": true, "POL-002": true, "POL-003": true, "POL-004": false });
  const policies = [
    ["POL-001", "Restricted Data Residency", "Organization", "IF classification = restricted", "THEN location = Saudi Arabia", "Protects restricted datasets from placement outside approved national boundaries."],
    ["POL-002", "Cross-Department GPU Sharing", "Organization", "IF resource = GPU AND classification ≤ Internal", "ALLOW cross_department = true", "Allows internal portable workloads to consume explicitly shared GPU pools."],
    ["POL-003", "Reserved Capacity Floor", "Infrastructure", "FOR EVERY cluster", "RETAIN allocatable_capacity ≥ 20%", "Preserves local burst headroom before capacity can be offered to other owners."],
    ["POL-004", "Confidential Research Review", "Security", "IF classification = Confidential", "REQUIRE security_officer_approval", "Adds a security review gate for confidential research workloads."],
  ];
  return <div className="view-enter"><PageHeader eyebrow="POLICY AS CODE" title="Governance policies" description="Organization-approved constraints made deterministic and explainable." action={<button className="primary-button"><Plus size={16} /> Create policy</button>} /><div className="policy-summary"><span><b>18</b> Active policies</span><span><b>3,842</b> Evaluations today</span><span><b>27</b> Violations prevented</span><span><b>0</b> Unresolved conflicts</span></div><div className="policy-list">{policies.map(([id, title, scope, condition, effect, description]) => <article className="policy-card panel" key={id}><div className="policy-id"><code>{id}</code><Pill tone={scope === "Security" ? "blue" : "neutral"}>{scope}</Pill></div><div className="policy-copy"><h3>{title}</h3><p>{description}</p><div className="policy-code"><span>{condition}</span><b>{effect}</b></div></div><div className="policy-actions"><button className={`toggle ${enabled[id] ? "on" : ""}`} onClick={() => setEnabled((current) => ({ ...current, [id]: !current[id] }))} aria-label={`Toggle ${title}`}><i /></button><button className="icon-button" aria-label={`Edit ${title}`}><Code2 size={15} /></button></div></article>)}</div></div>;
}

function Kubernetes({ approval }: { approval: ApprovalState }) {
  return <div className="view-enter"><PageHeader eyebrow="EXECUTION LAYER" title="Kubernetes" description="Cluster discovery and isolated execution—governed by AETHER decisions." action={<div className="mode-badge"><span>DEMO MODE</span><StatusDot tone="blue" /> Safe simulation active</div>} /><div className="kube-banner panel"><div className="kube-logo"><Container size={26} /></div><div><span>CONNECTED THROUGH LOCAL AGENTS</span><h2>5 Kubernetes clusters healthy</h2><p>Read-only discovery credentials active. Execution identity is isolated and invoked only after approval.</p></div><button className="secondary-button"><Settings2 size={15} /> Connector settings</button></div><div className="kube-metrics"><MetricCard label="Total nodes" value="38" detail="36 ready · 2 cordoned" icon={Server} /><MetricCard label="Allocatable CPU" value="3,182" detail="1,221 vCPU shareable" icon={Cpu} /><MetricCard label="Accelerators" value="126" detail="28 GPUs shareable" icon={Zap} /><MetricCard label="Active workloads" value="486" detail="612 pods running" icon={Boxes} /></div><div className="kube-grid"><article className="panel"><div className="panel-heading"><div><span className="panel-kicker">CLUSTERS</span><h3>Agent status</h3></div><span className="live-chip"><StatusDot /> Live</span></div>{environments.slice(0, 5).map((env) => <div className="cluster-row" key={env.cluster}><StatusDot tone={env.status === "Near capacity" ? "amber" : "green"} /><div><b>{env.cluster}</b><small>{env.name}</small></div><span>{env.kubernetes.split(" · ")[0]}</span><em>{env.cpu}% CPU</em><ChevronRight size={15} /></div>)}</article><article className="panel connector-panel"><span className="panel-kicker">LAST EXECUTION</span>{approval === "running" ? <><div className="terminal-head"><span><StatusDot /> RUNNING</span><code>dep-0148</code></div><h3>vision-model-training</h3><p><code>college-a / PSI-GPU-01</code></p><div className="terminal"><span><i>›</i> namespace/college-a created</span><span><i>›</i> resourcequota/aether-quota applied</span><span><i>›</i> deployment/vision-model-training created</span><span className="success"><i>✓</i> 1/1 pod ready in 2.4s</span></div></> : <><div className="terminal-empty"><TerminalSquare size={27} /><b>No active execution</b><span>Approve the current placement to create an isolated Kubernetes workload.</span></div></>}</article></div></div>;
}

function Audit({ events }: { events: typeof initialAudit }) {
  return <div className="view-enter"><PageHeader eyebrow="IMMUTABLE HISTORY" title="Audit log" description="Decision evidence, owner actions, and connector events in one trace." action={<button className="secondary-button"><FileCheck2 size={15} /> Export audit bundle</button>} /><div className="audit-integrity panel"><ShieldCheck size={19} /><div><b>Audit chain verified</b><span>2,941 events · last integrity check 22 seconds ago · SHA-256</span></div><Pill tone="green">VERIFIED</Pill></div><div className="table-toolbar"><label className="search-field"><Search size={15} /><input placeholder="Search actors, actions, or targets" aria-label="Search audit log" /></label><button className="secondary-button"><SlidersHorizontal size={15} /> Filters</button></div><div className="audit-table panel"><div className="audit-row table-head"><span>Timestamp</span><span>Actor</span><span>Action</span><span>Target</span><span>Outcome</span><span /></div>{events.map((event, i) => <div className="audit-row" key={`${event.time}-${i}`}><span><code>02 OCT 2026</code><b>{event.time} AST</b></span><span>{event.actor}</span><span>{event.action}</span><span>{event.target}</span><span><Pill tone={event.outcome.includes("Blocked") || event.outcome.includes("mismatch") ? "red" : event.outcome.includes("Pending") ? "amber" : "green"}>{event.outcome}</Pill></span><span><ChevronRight size={15} /></span></div>)}</div></div>;
}

export function AetherApp() {
  const [page, setPage] = useState<PageId>("overview");
  const [mobileNav, setMobileNav] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [processStatus, setProcessStatus] = useState<"idle" | "running" | "complete">("idle");
  const [processIndex, setProcessIndex] = useState(0);
  const [approval, setApproval] = useState<ApprovalState>("draft");
  const [events, setEvents] = useState(initialAudit);

  const title = useMemo(() => page === "request" ? "New placement" : page === "results" ? "Placement decision" : nav.find((item) => item.id === page)?.label ?? "Overview", [page]);
  const navigate = (id: PageId) => { setPage(id); setMobileNav(false); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const addAudit = (action: string, target: string, outcome: string, actor = "AETHER Engine") => setEvents((current) => [{ time: new Date().toLocaleTimeString("en-GB", { hour12: false, timeZone: "Asia/Riyadh" }), actor, action, target, outcome }, ...current]);

  useEffect(() => {
    if (processStatus !== "running") return;
    const timer = window.setInterval(() => setProcessIndex((current) => {
      if (current >= processSteps.length - 1) {
        window.clearInterval(timer);
        window.setTimeout(() => { setProcessStatus("complete"); addAudit("Placement evaluated", "Vision Model Training → PSI-GPU-01", "Eligible · 94%"); }, 450);
        return current;
      }
      return current + 1;
    }), 460);
    return () => window.clearInterval(timer);
  }, [processStatus]);

  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(null), 3200); return () => window.clearTimeout(timer); }, [toast]);

  const runEngine = () => { setProcessStatus("running"); setProcessIndex(0); navigate("results"); };
  const requestApproval = () => { setApproval("pending"); addAudit("Approval requested", "Vision Model Training", "Infrastructure owner pending", "Maha Al-Qahtani"); setToast("Approval request sent to Prince Sultan Institute"); navigate("approvals"); };
  const approve = () => { setApproval("approved"); addAudit("Infrastructure approval granted", "Vision Model Training → PSI-GPU-01", "Approved", "Omar Al-Rashid"); setToast("Both owner approvals are complete"); };
  const reject = () => { setApproval("rejected"); addAudit("Infrastructure approval rejected", "Vision Model Training → PSI-GPU-01", "Blocked", "Omar Al-Rashid"); };
  const deploy = () => { if (approval !== "approved") return; setApproval("deploying"); addAudit("Kubernetes deployment initiated", "college-a / vision-model-training", "Deploying", "Kubernetes Connector"); window.setTimeout(() => { setApproval("running"); addAudit("Deployment reconciled", "college-a / vision-model-training", "Running", "Kubernetes Connector"); setToast("Workload is running on PSI-GPU-01"); }, 2400); };

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? "open" : ""}`}>
        <div className="brand"><div className="brand-mark"><Sparkles size={17} /></div><div><b>AETHER</b><span>INFRASTRUCTURE INTELLIGENCE</span></div><button className="mobile-close" onClick={() => setMobileNav(false)}><X size={17} /></button></div>
        <div className="organization-select"><div className="org-seal">K</div><div><span>ORGANIZATION</span><b>King Saud University</b></div><ChevronDown size={14} /></div>
        <nav>{nav.map(({ label, id, icon: Icon, badge }) => <button key={id} className={page === id ? "active" : ""} onClick={() => navigate(id)}><Icon size={17} /><span>{label}</span>{badge && approval === "pending" && <em>{badge}</em>}</button>)}</nav>
        <div className="sidebar-spacer" />
        <div className="control-status"><div><span><StatusDot /> CONTROL PLANE</span><b>All systems operational</b></div><small>12 agents · synced 18s ago</small></div>
        <div className="sidebar-user"><div className="avatar">MA</div><div><b>Maha Al-Qahtani</b><span>Platform Administrator</span></div><Settings2 size={15} /></div>
      </aside>
      {mobileNav && <button className="nav-scrim" onClick={() => setMobileNav(false)} aria-label="Close navigation" />}
      <main className="main-shell">
        <header className="topbar"><div className="breadcrumb"><button className="mobile-menu" onClick={() => setMobileNav(true)}><Layers3 size={18} /></button><span>AETHER</span><ChevronRight size={13} /><b>{title}</b></div><div className="top-actions">{searchOpen ? <label className="top-search"><Search size={14} /><input autoFocus placeholder="Search infrastructure…" onBlur={() => setSearchOpen(false)} /></label> : <button className="icon-button" aria-label="Search" onClick={() => setSearchOpen(true)}><Search size={16} /></button>}<button className="icon-button notification" aria-label="Notifications"><Bell size={16} /><i /></button><span className="divider" /><div className="demo-chip"><CircleDot size={13} /> DEMO MODE</div></div></header>
        <div className="page-content">
          {page === "overview" && <Overview navigate={navigate} />}
          {page === "infrastructure" && <Infrastructure />}
          {page === "topology" && <Topology />}
          {page === "workloads" && <Workloads navigate={navigate} />}
          {page === "request" && <PlacementRequest navigate={navigate} runEngine={runEngine} />}
          {page === "results" && <PlacementResults status={processStatus} processIndex={processIndex} requestApproval={requestApproval} navigate={navigate} />}
          {page === "approvals" && <Approvals approval={approval} approve={approve} reject={reject} deploy={deploy} />}
          {page === "policies" && <Policies />}
          {page === "kubernetes" && <Kubernetes approval={approval} />}
          {page === "audit" && <Audit events={events} />}
        </div>
      </main>
      {toast && <div className="toast"><CheckCircle2 size={17} /><span>{toast}</span><button onClick={() => setToast(null)}><X size={14} /></button></div>}
    </div>
  );
}
