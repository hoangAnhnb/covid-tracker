import React, { useState, useEffect, useMemo, useCallback } from "react";
import { FixedSizeList as List } from "react-window";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";

const API_URL = "https://disease.sh/v3/covid-19/countries";

type CountryData = {
  country: string;
  cases: number;
  deaths: number;
  recovered: number;
  updated: number;
  countryInfo: { flag: string };
};

const fetchCovidData = async (): Promise<CountryData[]> => {
  const response = await fetch(API_URL);
  if (!response.ok) throw new Error("Failed to fetch data");
  return response.json();
};

console.log("data:", fetchCovidData());

const CovidTracker: React.FC = () => {
  const [countries, setCountries] = useState<CountryData[]>([]);
  const [globalStats, setGlobalStats] = useState({
    cases: 0,
    deaths: 0,
    recovered: 0,
  });
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const updateData = async () => {
      try {
        const data = await fetchCovidData();
        const sortedData = [...data].sort((a, b) => b.cases - a.cases);
        const vietnam = sortedData.find((c) => c.country === "Vietnam");
        if (vietnam)
          sortedData.unshift(
            sortedData.splice(sortedData.indexOf(vietnam), 1)[0]
          );
        setCountries(sortedData.slice(0, 100));

        const totalCases = data.reduce((sum, c) => sum + c.cases, 0);
        const totalDeaths = data.reduce((sum, c) => sum + c.deaths, 0);
        const totalRecovered = data.reduce((sum, c) => sum + c.recovered, 0);
        setGlobalStats({
          cases: totalCases,
          deaths: totalDeaths,
          recovered: totalRecovered,
        });
        setError(null);
      } catch (err) {
        setError("Không thể tải dữ liệu. Vui lòng thử lại sau.");
      }
    };

    updateData();
    const interval = setInterval(updateData, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredCountry = useMemo(
    () =>
      countries.find((c) => c.country.toLowerCase() === search.toLowerCase()),
    [search, countries]
  );

  const handleSearch = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setSearch(event.target.value);
    },
    []
  );

  return (
    <div className="p-5 max-w-4xl mx-auto text-center">
      <h1 className="text-4xl font-bold text-red-500">
        {globalStats.cases.toLocaleString()}
      </h1>
      <div className="flex justify-center gap-10 text-lg font-semibold text-gray-700 mt-2">
        <p>
          <span className="text-black">
            {globalStats.deaths.toLocaleString()}
          </span>
          <br />
          DEATHS
        </p>
        <p>
          <span className="text-black">
            {globalStats.recovered.toLocaleString()}
          </span>
          <br />
          RECOVERIES
        </p>
      </div>
      {error && <p className="text-red-500 mt-2">{error}</p>}

      <Input
        type="text"
        placeholder="Search regions..."
        className="w-auto mt-6 p-3 border rounded-lg text-lg shadow-md mx-auto"
        value={search}
        onChange={handleSearch}
      />
      {filteredCountry && (
        <motion.div
          className="mt-4 text-lg font-semibold bg-white p-4 rounded-lg shadow-md"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <p>Cases: {filteredCountry.cases.toLocaleString()}</p>
          <p>Deaths: {filteredCountry.deaths.toLocaleString()}</p>
          <p>Recovered: {filteredCountry.recovered.toLocaleString()}</p>
        </motion.div>
      )}

      <div className="flex justify-center items-center mt-6">
        <List
          className="border rounded-lg shadow-md"
          height={600}
          itemCount={countries.length}
          itemSize={60}
          width={400}
        >
          {({ index, style }) => {
            const country = countries[index];
            return (
              <div
                style={style}
                className="flex items-center justify-between p-3 border-b bg-white text-lg font-semibold"
              >
                <span className="text-gray-500 w-6">{index + 1}</span>
                <img
                  src={country.countryInfo.flag}
                  alt={country.country}
                  className="w-8 h-5 rounded-sm mx-2"
                />
                <div className="flex-1 text-left">
                  <span>{country.country}</span>
                  <p className="text-xs text-gray-400">
                    {formatDistanceToNow(new Date(country.updated), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
                {/* <span className="flex-1 text-left">{country.country}</span> */}
                <span className="text-red-500 font-bold">
                  {country.cases.toLocaleString()}
                </span>
              </div>
            );
          }}
        </List>
      </div>
    </div>
  );
};

export default CovidTracker;
