import { formatMaskedTokens, formatPredictionTime, formatTokens, rankedMembers, type Prediction } from "@/lib/ge-prediction";

const groups = [
  { name: "Senbutsu", start: 1, end: 12, color: "text-amber-200" },
  { name: "Under Girls", start: 13, end: 24, color: "text-slate-200" },
  { name: "Next Girls", start: 25, end: 36, color: "text-orange-200" },
];

export function PredictionResults({ prediction }: { prediction: Prediction }) {
  const members = rankedMembers(prediction.members);
  return (
    <div>
      <div className="mt-3 space-y-1 text-sm leading-relaxed text-[#9896b0]">
        <p>ข้อมูล ณ เวลา {formatPredictionTime(prediction.asOf)}</p>
        <p>จำนวนโหวตรวม <span className="text-white">{formatTokens(prediction.totalTokens)}</span> tokens</p>
        <p>ยังไม่ระบุ <span className="text-white">{formatTokens(prediction.unassignedTokens)}</span> tokens</p>
      </div>
      <div className="mt-6 flex gap-4 text-xs"><span className="text-purple-300">● BNK48</span><span className="text-[#7de2c3]">● CGM48</span></div>
      <div className="mt-4 space-y-6">
        {groups.map(group => (
          <section key={group.name} className="overflow-hidden rounded-2xl border border-[#2a2a3d] bg-[#13131e]">
            <h2 className={`flex justify-between border-b border-[#2a2a3d] px-4 py-3 font-semibold ${group.color}`}>
              {group.name}<span className="text-xs font-normal text-[#9896b0]">อันดับ {group.start}–{group.end}</span>
            </h2>
            <table className="w-full table-fixed text-sm">
              <caption className="sr-only">ผลคาดการณ์ {group.name} อันดับ {group.start} ถึง {group.end}</caption>
              <tbody className="divide-y divide-white/5">
                {Array.from({ length: 6 }, (_, row) => (
                  <tr key={row}>
                    {[0, 1].map(column => {
                      const rank = group.start + row + column * 6;
                      const member = members[rank - 1];
                      return (
                        <td key={column} className="w-1/2 border-r border-white/5 px-3 py-3 align-top last:border-r-0 sm:px-4">
                          {member && (
                            <div className="flex items-start gap-2">
                              <span className="w-5 shrink-0 text-center tabular-nums text-[#9896b0]">{rank}</span>
                              <div className="min-w-0 flex-1">
                                <p className={`break-words font-semibold ${member.group === "BNK48" ? "text-purple-300" : "text-[#7de2c3]"}`}>{member.name} <span className="whitespace-nowrap text-[10px] font-normal">{member.group}</span></p>
                                <p className="mt-1 break-words text-xs tabular-nums text-[#9896b0]">{formatMaskedTokens(member.tokens)} tokens</p>
                              </div>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))}
      </div>
    </div>
  );
}
