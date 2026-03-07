#include "include/json.hpp"
#include <cmath>
#include <fstream>
#include <iomanip>
#include <iostream>
#include <sstream>
#include <string>
#include <vector>


using json = nlohmann::json;

struct PricePoint {
  std::string date;
  double price;
};

struct StrategyConfig {
  std::string name;
  double lowVolMultiplier;
  double highVolMultiplier;
  double volThreshold;
};

struct StrategyResult {
  std::string name;
  double apy;
  std::string winRate;
  std::string maxDrawdown;
  int totalCycles;
  double netPnL;
  std::vector<double> monthlyReturns;
};

std::vector<PricePoint> loadPrices(const std::string &filename) {
  std::vector<PricePoint> prices;
  std::ifstream file(filename);
  std::string line;

  if (std::getline(file, line)) {
    // Skip header
  }

  while (std::getline(file, line)) {
    std::stringstream ss(line);
    std::string date, priceStr;
    if (std::getline(ss, date, ',') && std::getline(ss, priceStr)) {
      prices.push_back({date, std::stod(priceStr)});
    }
  }
  return prices;
}

StrategyResult simulateStrategy(const StrategyConfig &config,
                                const std::vector<PricePoint> &prices) {
  if (prices.size() < 7)
    return {};

  double vaultBalance = 100.0; // Start with 100 ETH
  double initialBalance = vaultBalance;
  double peakBalance = vaultBalance;
  double maxDrawdown = 0.0;
  int totalCycles = 0;
  int winningCycles = 0;

  std::vector<double> monthlyReturns(12, 0.0);
  std::vector<int> monthlyCycles(12, 0);

  for (size_t i = 7; i < prices.size() - 7; i += 7) {
    // Check volatility
    double startPrice = prices[i - 7].price;
    double currentPrice = prices[i].price;
    double delta = std::abs(currentPrice - startPrice);
    bool isHighVol = delta > config.volThreshold;

    // Set strike price and premium
    double strikePrice = currentPrice * (isHighVol ? config.highVolMultiplier
                                                   : config.lowVolMultiplier);
    double premiumPct = isHighVol ? 0.04 : 0.02; // 4% high vol, 2% low vol
    double premium = vaultBalance * premiumPct;

    vaultBalance += premium; // Collect premium

    // Check settlement at end of cycle (7 days later)
    double settlementPrice = prices[i + 7].price;
    bool exercised = settlementPrice > strikePrice;

    double cycleReturn = premiumPct;

    if (exercised) {
      // Need to buy back ETH at higher price to cover
      double loss =
          vaultBalance * ((settlementPrice - strikePrice) / strikePrice);
      vaultBalance -= loss;
      cycleReturn -= (loss / vaultBalance);
    } else {
      winningCycles++;
    }

    // Track stats
    if (vaultBalance > peakBalance) {
      peakBalance = vaultBalance;
    } else {
      double drawdown = (peakBalance - vaultBalance) / peakBalance;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    // Add to monthly return (rough approximation, assuming 4 cycles per month)
    int monthIndex = (totalCycles / 4) % 12;
    monthlyReturns[monthIndex] += cycleReturn * 100;
    monthlyCycles[monthIndex]++;

    totalCycles++;
  }

  double netPnL = ((vaultBalance - initialBalance) / initialBalance) * 100;
  // Annualize return based on actual cycles (assuming 52 cycles in a year)
  double annualizedReturn = netPnL * (52.0 / std::max(1, totalCycles));

  StrategyResult result;
  result.name = config.name;
  result.apy = annualizedReturn;

  std::stringstream wr;
  wr << std::fixed << std::setprecision(1)
     << (winningCycles * 100.0 / totalCycles) << "%";
  result.winRate = wr.str();

  std::stringstream md;
  md << "-" << std::fixed << std::setprecision(1) << (maxDrawdown * 100.0)
     << "%";
  result.maxDrawdown = md.str();

  result.totalCycles = totalCycles;
  result.netPnL = netPnL;
  result.monthlyReturns = monthlyReturns;

  return result;
}

int main() {
  std::cout << "Loading price data..." << std::endl;
  auto prices = loadPrices("data/eth_prices.csv");
  if (prices.empty()) {
    std::cerr << "Error: Could not load data/eth_prices.csv or file is empty."
              << std::endl;
    return 1;
  }
  std::cout << "Loaded " << prices.size() << " price points." << std::endl;

  std::vector<StrategyConfig> configs = {{"Conservative", 1.10, 1.20, 500.0},
                                         {"Aggressive", 1.05, 1.10, 300.0},
                                         {"Balanced", 1.08, 1.15, 400.0}};

  json output;
  output["strategies"] = json::array();

  const std::vector<std::string> monthNames = {"Jan", "Feb", "Mar", "Apr",
                                               "May", "Jun", "Jul", "Aug",
                                               "Sep", "Oct", "Nov", "Dec"};

  std::vector<std::vector<double>> allMonthlyReturns(3); // 3 strategies

  for (size_t i = 0; i < configs.size(); ++i) {
    std::cout << "Simulating " << configs[i].name << "..." << std::endl;
    StrategyResult res = simulateStrategy(configs[i], prices);
    allMonthlyReturns[i] = res.monthlyReturns;

    // Round APY to 1 decimal place
    double apyRounded = std::round(res.apy * 10.0) / 10.0;
    double pnlRounded = std::round(res.netPnL * 10.0) / 10.0;

    json stratJson = {{"name", res.name},
                      {"apy", apyRounded},
                      {"winRate", res.winRate},
                      {"maxDrawdown", res.maxDrawdown},
                      {"totalCycles", res.totalCycles},
                      {"netPnL", pnlRounded}};
    output["strategies"].push_back(stratJson);
  }

  output["monthlyData"] = json::array();
  for (int month = 0; month < 12; ++month) {
    double consReturn = std::round(allMonthlyReturns[0][month] * 10.0) / 10.0;
    double aggReturn = std::round(allMonthlyReturns[1][month] * 10.0) / 10.0;
    double balReturn = std::round(allMonthlyReturns[2][month] * 10.0) / 10.0;

    json monthData = {{"month", monthNames[month]},
                      {"conservative", consReturn},
                      {"aggressive", aggReturn},
                      {"balanced", balReturn}};
    output["monthlyData"].push_back(monthData);
  }

  std::ofstream outFile("results/backtest_results.json");
  outFile << output.dump(2);
  outFile.close();

  std::cout
      << "Backtest complete. Results saved to results/backtest_results.json"
      << std::endl;
  return 0;
}
