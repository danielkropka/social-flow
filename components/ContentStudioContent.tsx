import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import {
  LineChart,
  Line,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import { SUPPORTED_PLATFORMS, PLATFORM_DISPLAY } from "@/constants";

interface Account {
  id: string;
  provider: string;
  name?: string;
  username?: string;
  providerAccountId?: string;
  followersCount?: number;
  postsCount?: number;
}

const lineChartData = Array.from({ length: 22 }, (_, i) => ({
  day: i + 2,
  Instagram: Math.floor(Math.random() * 3000) + 2000,
  TikTok: Math.floor(Math.random() * 4000) + 6000,
  Facebook: Math.floor(Math.random() * 2000) + 8000,
  Twitter: Math.floor(Math.random() * 1000) + 3000,
}));

const followerSegmentation = [
  { label: "18-24 lata", value: 14797 },
  { label: "25-32 lata", value: 5425 },
  { label: "33-50 lat", value: 4439 },
];

const days = ["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Niedz"];
const hours = ["0-3", "3-6", "6-9", "9-12", "12-15", "15-18", "18-21", "21-24"];
// Generuj przykładowe dane do heatmapy
const heatmap = days.flatMap((day) =>
  hours.map((hour) => ({
    day,
    hour,
    value: Math.floor(Math.random() * 1000),
  }))
);

const recentActivities = [
  {
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    text: "alex.thompson zaczął Cię obserwować",
    date: "13 gru, 08:14",
    platform: "TikTok",
  },
  {
    avatar: "https://randomuser.me/api/portraits/men/33.jpg",
    text: "Ronald Dacey polubił Twój post",
    date: "13 gru, 08:05",
    platform: "Facebook",
  },
  {
    avatar: "https://randomuser.me/api/portraits/men/34.jpg",
    text: "@nick.robinson zaczął Cię obserwować",
    date: "13 gru, 07:46",
    platform: "Instagram",
  },
  {
    avatar: "https://randomuser.me/api/portraits/men/35.jpg",
    text: "Ben Raleway zaczął Cię obserwować",
    date: "13 gru, 07:35",
    platform: "Facebook",
  },
  {
    avatar: "https://randomuser.me/api/portraits/men/36.jpg",
    text: "Ben Raleway polubił Twój post",
    date: "13 gru, 07:33",
    platform: "Facebook",
  },
];

function ContentStudioContent() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date(),
  });

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    fetch("/api/accounts")
      .then((res) => res.json())
      .then((data) => {
        setAccounts(data.accounts || []);
        const grouped = data.accounts.reduce(
          (acc: Record<string, string>, curr: Account) => {
            if (!acc[curr.provider]) acc[curr.provider] = curr.id;
            return acc;
          },
          {}
        );
        setSelectedAccounts(grouped);
      });
  }, []);

  // Funkcja do filtrowania kont po platformie
  const getAccountsByProvider = (provider: string) =>
    accounts.filter((acc) => acc.provider === provider);

  return (
    <div className="p-6 space-y-6">
      {/* Nagłówek i filtr daty */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
        <div>
          <h1 className="text-3xl font-bold">Przegląd</h1>
          <p className="text-gray-500 text-sm mt-1">
            Podsumowanie informacji o liczbie obserwujących, odwiedzających i
            innych statystykach.
          </p>
        </div>
        <div>
          <DateRangePicker value={dateRange} onChange={setDateRange} />
        </div>
      </div>

      {/* Selecty do wyboru kont */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {Object.values(SUPPORTED_PLATFORMS).map((platform) => {
          const { icon: Icon, label } = PLATFORM_DISPLAY[platform];
          const providerAccounts = getAccountsByProvider(platform);
          const hasAccount = providerAccounts.length > 0;
          const selectedId = hasAccount
            ? selectedAccounts[platform] || providerAccounts[0].id
            : undefined;
          const selectedAccount = hasAccount
            ? providerAccounts.find((acc) => acc.id === selectedId) ||
              providerAccounts[0]
            : undefined;
          return (
            <Card
              key={platform}
              className="p-6 flex flex-col justify-between min-h-[140px]"
            >
              <div className="flex items-center gap-3 mb-2">
                <Icon className="h-5 w-5" />
                <div>
                  {hasAccount ? (
                    providerAccounts.length > 1 ? (
                      <select
                        className="border rounded px-2 py-1 font-semibold"
                        value={selectedId}
                        onChange={(e) =>
                          setSelectedAccounts((prev) => ({
                            ...prev,
                            [platform]: e.target.value,
                          }))
                        }
                      >
                        {providerAccounts.map((acc) => (
                          <option key={acc.id} value={acc.id}>
                            {acc.name || acc.username || acc.providerAccountId}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="font-semibold">
                        {selectedAccount?.name ||
                          selectedAccount?.username ||
                          selectedAccount?.providerAccountId}
                      </div>
                    )
                  ) : (
                    <div className="font-semibold text-gray-400">
                      Brak połączonego konta
                    </div>
                  )}
                  <div className="text-xs text-gray-500">{label}</div>
                </div>
              </div>
              {hasAccount && selectedAccount ? (
                <>
                  <div className="text-2xl font-bold mt-2">
                    {selectedAccount.followersCount?.toLocaleString() ?? "-"}{" "}
                    <span className="text-base font-normal text-gray-500">
                      Obserwujących
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {selectedAccount.postsCount?.toLocaleString() ?? "-"} postów
                  </div>
                </>
              ) : null}
            </Card>
          );
        })}
      </div>

      {/* Wykres followersów */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex justify-between items-center mb-2">
          <div className="font-semibold">Twoi obserwujący</div>
          <div className="flex gap-4 text-xs">
            {Object.values(SUPPORTED_PLATFORMS).map((platform) => {
              const { icon } = PLATFORM_DISPLAY[platform];
              return (
                <span key={platform} className="flex items-center gap-1">
                  <span
                    className={`w-3 h-3 rounded-full ${icon} inline-block`}
                  />
                  {platform}
                </span>
              );
            })}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart
            data={lineChartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Legend />
            {Object.values(SUPPORTED_PLATFORMS).map((platform) => {
              const { strokeColor } = PLATFORM_DISPLAY[platform];
              return (
                <Line
                  key={platform}
                  type="monotone"
                  dataKey={platform}
                  stroke={strokeColor}
                  strokeWidth={2}
                  dot={false}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Segmentacja followersów i heatmapa + aktywności */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Segmentacja followersów */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Segmentacja obserwujących</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {followerSegmentation.map((seg) => (
                <div
                  key={seg.label}
                  className="flex items-center justify-between gap-2"
                >
                  <span className="text-sm text-gray-600">{seg.label}</span>
                  <div className="flex-1 mx-2 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${(seg.value / 15000) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold">
                    {seg.value.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Heatmapa zaangażowania */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Zaangażowanie postów</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead>
                  <tr>
                    <th className="text-left p-1"></th>
                    {hours.map((hour) => (
                      <th
                        key={hour}
                        className="text-center p-1 font-normal text-gray-500"
                      >
                        {hour}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {days.map((day) => (
                    <tr key={day}>
                      <td className="pr-2 text-gray-500 font-medium">{day}</td>
                      {hours.map((hour) => {
                        const cell = heatmap.find(
                          (h) => h.day === day && h.hour === hour
                        );
                        const value = cell ? cell.value : 0;
                        let bg = "bg-gray-100";
                        if (value > 800) bg = "bg-orange-500";
                        else if (value > 600) bg = "bg-orange-400";
                        else if (value > 400) bg = "bg-orange-300";
                        else if (value > 200) bg = "bg-orange-200";
                        return (
                          <td
                            key={hour}
                            className={`text-center p-1 ${bg} rounded`}
                          >
                            {value}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Ostatnie aktywności */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Ostatnie aktywności</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivities.map((act, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <img
                    src={act.avatar}
                    alt="avatar"
                    className="w-8 h-8 rounded-full"
                  />
                  <div>
                    <div className="text-sm">{act.text}</div>
                    <div className="text-xs text-gray-400">
                      {act.date} - {act.platform}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default ContentStudioContent;
