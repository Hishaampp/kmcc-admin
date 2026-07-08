"use client";

const money = (n: number) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n || 0);

const JOIN_MONTHS: Record<string, string> = {
  "1": "January", "2": "February", "3": "March", "4": "April",
  "5": "May", "6": "June", "7": "July", "8": "August",
  "9": "September", "10": "October", "11": "November", "12": "December",
};

type Payment = {
  id: string;
  projectId: string;
  projectName: string;
  memberId: string;
  month: string;
  year: number | string;
  amount: number;
  createdAt?: any;
};

type Props = {
  member: any;
  payments: Payment[];
  loading: boolean;
  onClose: () => void;
};

export default function MemberDetailsModal({ member, payments, loading, onClose }: Props) {
  const totalDeposited = payments.reduce((s, p) => s + Number(p.amount || 0), 0);

  // Group payments by project
  const projectMap: Record<string, { projectName: string; total: number; count: number }> = {};
  payments.forEach(p => {
    const key = p.projectId || "unknown";
    if (!projectMap[key]) {
      projectMap[key] = { projectName: p.projectName || "Unknown Project", total: 0, count: 0 };
    }
    projectMap[key].total += Number(p.amount || 0);
    projectMap[key].count += 1;
  });
  const projectRows = Object.entries(projectMap)
    .map(([projectId, v]) => ({ projectId, ...v }))
    .sort((a, b) => b.total - a.total);

  // Most recent payments first
  const sortedPayments = [...payments].sort((a, b) => {
    const aTime = a.createdAt?.seconds ?? 0;
    const bTime = b.createdAt?.seconds ?? 0;
    if (aTime !== bTime) return bTime - aTime;
    return Number(b.year) - Number(a.year);
  });

  const quitProjects: string[] = member.quitProjects || [];

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto text-black">

        <div className="p-6 border-b sticky top-0 bg-white z-10">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold">{member.name}</h2>
              <p className="text-sm text-gray-600">
                Member #{member.number} · {member.unitName}
              </p>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-black text-xl leading-none">
              ✕
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded">
            <div>
              <p className="text-xs text-gray-500">Contact Number</p>
              <p className="font-semibold">{member.contactNumber || "Not Added"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Joined</p>
              <p className="font-semibold">
                {member.joinMonth ? JOIN_MONTHS[member.joinMonth] : ""} {member.joinYear || ""}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Nominee</p>
              <p className="font-semibold">{member.nomineeName || "Not Added"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Nominee Contact</p>
              <p className="font-semibold">{member.nomineeContact || "Not Added"}</p>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800">Total Deposited (All Projects)</p>
            <p className="text-3xl font-bold text-green-700">₹{money(totalDeposited)}</p>
            <p className="text-xs text-green-700 mt-1">
              {payments.length} payment{payments.length !== 1 ? "s" : ""} recorded
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Project-wise Contribution</h3>
            {loading ? (
              <p className="text-gray-500 text-sm">Loading...</p>
            ) : projectRows.length === 0 ? (
              <p className="text-gray-500 text-sm">No payments recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {projectRows.map(row => {
                  const hasQuit = quitProjects.includes(row.projectId);
                  return (
                    <div key={row.projectId} className="flex justify-between items-center border rounded p-3">
                      <div>
                        <p className="font-medium">{row.projectName}</p>
                        <p className="text-xs text-gray-500">
                          {row.count} payment{row.count !== 1 ? "s" : ""}
                          {hasQuit && <span className="text-orange-600 ml-2">· Quit from this project</span>}
                        </p>
                      </div>
                      <p className="font-bold">₹{money(row.total)}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {quitProjects.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2 text-orange-700">Quit History</h3>
              <div className="space-y-2">
                {quitProjects.map((pId: string) => {
                  const info = member.quitHistory?.[pId];
                  return (
                    <div key={pId} className="border border-orange-200 bg-orange-50 rounded p-3 text-sm">
                      <p className="font-medium">{info?.projectName || pId}</p>
                      {info?.note && <p className="text-gray-600 mt-1">Reason: {info.note}</p>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <h3 className="font-semibold mb-2">Payment History</h3>
            {loading ? (
              <p className="text-gray-500 text-sm">Loading...</p>
            ) : sortedPayments.length === 0 ? (
              <p className="text-gray-500 text-sm">No payments recorded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border px-2 py-1 text-left">Project</th>
                      <th className="border px-2 py-1 text-left">Month</th>
                      <th className="border px-2 py-1 text-left">Year</th>
                      <th className="border px-2 py-1 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedPayments.map(p => (
                      <tr key={p.id}>
                        <td className="border px-2 py-1">{p.projectName}</td>
                        <td className="border px-2 py-1">{p.month}</td>
                        <td className="border px-2 py-1">{p.year}</td>
                        <td className="border px-2 py-1 text-right font-medium">₹{money(p.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

        <div className="p-4 border-t flex justify-end">
          <button onClick={onClose} className="border px-4 py-2 rounded hover:bg-gray-100 transition">
            Close
          </button>
        </div>

      </div>
    </div>
  );
}