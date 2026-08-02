export type AssetCatalogType = 'crypto' | 'stock' | 'forex' | 'commodity' | 'index' | 'bond';

export interface AssetCatalogCandidate {
  symbol: string;
  name: string;
  type: AssetCatalogType;
  subtype?: 'memecoin' | 'standard';
  aliases?: string[];
  catalogSource: string;
  instrumentKind: string;
  screeningContract: 'crypto-provenance' | 'traditional-provenance' | 'catalog-only';
}

const CURATED_SOURCE = 'CAPITAL-AI curated instrument reference 2026-08; runtime provider evidence remains mandatory';

function c(
  symbol: string,
  name: string,
  type: AssetCatalogType,
  instrumentKind: string,
  screeningContract: AssetCatalogCandidate['screeningContract'],
  aliases?: string[],
): AssetCatalogCandidate {
  return { symbol, name, type, instrumentKind, screeningContract, aliases, catalogSource: CURATED_SOURCE };
}

const cryptoSeeds: Array<[string, string]> = [
  ['TON', 'Toncoin'], ['TRX', 'TRON'], ['UNI', 'Uniswap'], ['USDT', 'Tether'], ['USDC', 'USD Coin'],
  ['DAI', 'Dai'], ['POL', 'Polygon Ecosystem Token'], ['AERO', 'Aerodrome Finance'], ['MORPHO', 'Morpho'], ['EIGEN', 'EigenLayer'],
  ['ETHFI', 'ether.fi'], ['PENGU', 'Pudgy Penguins'], ['VIRTUAL', 'Virtuals Protocol'], ['RENDER', 'Render'], ['HYPE', 'Hyperliquid'],
  ['SKY', 'Sky'], ['RSR', 'Reserve Rights'], ['LAYER', 'Solayer'], ['KAIA', 'Kaia'], ['FLUID', 'Fluid'],
  ['SONIC', 'Sonic'], ['MOVE', 'Movement'], ['BERA', 'Berachain'], ['IP', 'Story'], ['KAITO', 'Kaito'],
  ['FORM', 'Four'], ['WAL', 'Walrus'], ['DEEP', 'DeepBook'], ['CETUS', 'Cetus Protocol'], ['ZRO', 'LayerZero'],
  ['ZK', 'ZKsync'], ['AEVO', 'Aevo'], ['ALT', 'AltLayer'], ['MANTA', 'Manta Network'], ['METIS', 'Metis'],
  ['CELO', 'Celo'], ['ROSE', 'Oasis'], ['IOTA', 'IOTA'], ['XTZ', 'Tezos'], ['ONE', 'Harmony'],
  ['QTUM', 'Qtum'], ['ZEC', 'Zcash'], ['DASH', 'Dash'], ['RVN', 'Ravencoin'], ['KDA', 'Kadena'],
  ['CSPR', 'Casper'], ['XDC', 'XDC Network'], ['IOTX', 'IoTeX'], ['SKL', 'SKALE'], ['COTI', 'COTI'],
  ['NKN', 'NKN'], ['STORJ', 'Storj'], ['ARKM', 'Arkham'], ['WAXP', 'WAX'], ['HIVE', 'Hive'],
  ['BLZ', 'Bluzelle'], ['CELR', 'Celer Network'], ['MASK', 'Mask Network'], ['ACE', 'Fusionist'], ['PIXEL', 'Pixels'],
  ['PORTAL', 'Portal'], ['BIGTIME', 'Big Time'], ['BEAM', 'Beam'], ['PRIME', 'Echelon Prime'], ['MAGIC', 'Treasure'],
  ['SSV', 'SSV Network'], ['LQTY', 'Liquity'], ['FXS', 'Frax Share'], ['CVX', 'Convex Finance'], ['RPL', 'Rocket Pool'],
  ['SNX', 'Synthetix'], ['PERP', 'Perpetual Protocol'], ['POLS', 'Polkastarter'], ['JOE', 'Trader Joe'], ['SPELL', 'Spell Token'],
  ['ILV', 'Illuvium'], ['YGG', 'Yield Guild Games'], ['GODS', 'Gods Unchained'], ['ALCX', 'Alchemix'], ['ARBOR', 'Arbor Finance'],
  ['ANKR_NEW', 'Ankr Network'], ['KUB', 'Bitkub Coin'], ['KLAY', 'Klaytn'], ['GLM', 'Golem'], ['POWR', 'Powerledger'],
  ['DYM', 'Dymension'], ['SAGA', 'Saga'], ['OMNI', 'Omni Network'], ['SYN', 'Synapse'], ['COW', 'CoW Protocol'],
  ['SAFE_TOKEN', 'Safe'], ['GAS', 'Gas'], ['NEO3', 'Neo N3'], ['ONT', 'Ontology'], ['ONG', 'Ontology Gas'],
  ['CKB', 'Nervos Network'], ['SCROLL', 'Scroll'], ['LINEA', 'Linea'], ['MODE', 'Mode'], ['MAV', 'Maverick Protocol'],
  ['MAVIA', 'Heroes of Mavia'], ['RONIN', 'Ronin'], ['RATS', 'RATS'], ['ORDS', 'Ordiswap'], ['SATS_NEW', '1000SATS'],
  ['MEME', 'Memecoin'], ['BABYDOGE', 'Baby Doge Coin'], ['NEIRO', 'Neiro'], ['GOAT', 'Goatseus Maximus'], ['PNUT', 'Peanut the Squirrel'],
  ['FARTCOIN', 'Fartcoin'], ['GRASS', 'Grass'], ['DRIFT', 'Drift'], ['KMNO', 'Kamino'], ['TNSR', 'Tensor'],
  ['JTO_NEW', 'Jito'], ['ZEUS', 'Zeus Network'], ['IO', 'io.net'], ['ATH', 'Aethir'], ['AIOZ', 'AIOZ Network'],
  ['AKT_NEW', 'Akash Network'], ['NOS', 'Nosana'], ['TAIKO', 'Taiko'], ['ZORA', 'Zora'], ['MPL', 'Maple Finance'],
  ['SYRUP', 'Maple Finance Syrup'], ['CFG', 'Centrifuge'], ['GFI', 'Goldfinch'], ['TRU', 'TrueFi'], ['MPLX', 'Metaplex'],
  ['HFT', 'Hashflow'], ['ID', 'SPACE ID'], ['HOOK', 'Hooked Protocol'], ['HIGH', 'Highstreet'], ['CYBER', 'Cyber'],
  ['DODO', 'DODO'], ['BICO', 'Biconomy'], ['API3_NEW', 'API3'], ['UMA_NEW', 'UMA'], ['TRB_NEW', 'Tellor'],
  ['NMR', 'Numeraire'], ['MLN', 'Enzyme'], ['KP3R', 'Keep3rV1'], ['RBN', 'Ribbon Finance'], ['PENDLE_NEW', 'Pendle'],
  ['ENA_NEW', 'Ethena'], ['USDE', 'Ethena USDe'], ['SUSDE', 'Ethena Staked USDe'], ['PYUSD', 'PayPal USD'], ['RLUSD', 'Ripple USD'],
  ['EURC', 'EURC'], ['FDUSD_NEW', 'First Digital USD'], ['USDS', 'USDS'], ['FRXUSD', 'Frax USD'], ['GHO', 'GHO'],
  ['LDO_NEW', 'Lido DAO'], ['WSTETH', 'Wrapped stETH'], ['RETH', 'Rocket Pool ETH'], ['CBETH', 'Coinbase Wrapped Staked ETH'], ['WBTC', 'Wrapped Bitcoin'],
  ['TBTC', 'tBTC'], ['CBBTC', 'Coinbase Wrapped BTC'], ['KCS', 'KuCoin Token'], ['LEO', 'UNUS SED LEO'], ['OKB', 'OKB'],
  ['GT', 'GateToken'], ['CRO_NEW', 'Cronos'], ['XMR_NEW', 'Monero'], ['LTC_NEW', 'Litecoin'], ['BCH_NEW', 'Bitcoin Cash'],
  ['XLM_NEW', 'Stellar'], ['ATOM_NEW', 'Cosmos'], ['ETC_NEW', 'Ethereum Classic'], ['HBAR_NEW', 'Hedera'], ['VET_NEW', 'VeChain'],
];

const stockSeeds: Array<[string, string]> = [
  ['ABT', 'Abbott Laboratories'], ['ACN', 'Accenture plc'], ['ADP', 'Automatic Data Processing'], ['AEP', 'American Electric Power'], ['AFL', 'Aflac Inc.'],
  ['AIG', 'American International Group'], ['ALL', 'The Allstate Corp.'], ['AME', 'AMETEK Inc.'], ['AMT2', 'American Tower Corp.'], ['AON', 'Aon plc'],
  ['APD', 'Air Products and Chemicals'], ['APH', 'Amphenol Corp.'], ['ATO', 'Atmos Energy'], ['AVB', 'AvalonBay Communities'], ['AWK', 'American Water Works'],
  ['AXP2', 'American Express'], ['BDX', 'Becton Dickinson'], ['BK', 'Bank of New York Mellon'], ['BKNG', 'Booking Holdings'], ['BLK', 'BlackRock Inc.'],
  ['BRO', 'Brown & Brown'], ['BSX', 'Boston Scientific'], ['CARR', 'Carrier Global'], ['CB', 'Chubb Ltd.'], ['CDNS', 'Cadence Design Systems'],
  ['CEG', 'Constellation Energy'], ['CHTR', 'Charter Communications'], ['CI', 'The Cigna Group'], ['CL', 'Colgate-Palmolive'], ['CME', 'CME Group'],
  ['CMG', 'Chipotle Mexican Grill'], ['CNC', 'Centene Corp.'], ['COF', 'Capital One Financial'], ['COR', 'Cencora'], ['CPRT', 'Copart'],
  ['CRWD', 'CrowdStrike Holdings'], ['CSX', 'CSX Corp.'], ['CTAS', 'Cintas'], ['CTSH', 'Cognizant Technology Solutions'], ['D', 'Dominion Energy'],
  ['DAL', 'Delta Air Lines'], ['DD', 'DuPont de Nemours'], ['DHI', 'D.R. Horton'], ['DHR', 'Danaher Corp.'], ['DOW', 'Dow Inc.'],
  ['DUK', 'Duke Energy'], ['ECL', 'Ecolab'], ['ED', 'Consolidated Edison'], ['EL', 'Estée Lauder'], ['ELV', 'Elevance Health'],
  ['EOG', 'EOG Resources'], ['EPD', 'Enterprise Products Partners'], ['EQNR', 'Equinor ASA'], ['EXC', 'Exelon Corp.'], ['F', 'Ford Motor Co.'],
  ['FCX', 'Freeport-McMoRan'], ['FI', 'Fiserv'], ['FIS', 'Fidelity National Information Services'], ['GM', 'General Motors'], ['GPN', 'Global Payments'],
  ['HCA', 'HCA Healthcare'], ['HLT', 'Hilton Worldwide'], ['HUM', 'Humana'], ['ICE', 'Intercontinental Exchange'], ['IDXX', 'IDEXX Laboratories'],
  ['ITW', 'Illinois Tool Works'], ['JCI', 'Johnson Controls'], ['KDP', 'Keurig Dr Pepper'], ['KHC', 'Kraft Heinz'], ['KLAC', 'KLA Corp.'],
  ['KMB', 'Kimberly-Clark'], ['LHX', 'L3Harris Technologies'], ['LIN', 'Linde plc'], ['LRCX', 'Lam Research'], ['MAR', 'Marriott International'],
  ['MCO', 'Moody’s Corp.'], ['MDLZ', 'Mondelez International'], ['MET', 'MetLife'], ['MPC', 'Marathon Petroleum'], ['MSCI', 'MSCI Inc.'],
  ['NEE', 'NextEra Energy'], ['NOW', 'ServiceNow'], ['O', 'Realty Income'], ['ORLY', 'O’Reilly Automotive'], ['PANW', 'Palo Alto Networks'],
  ['PCAR', 'PACCAR'], ['PGR', 'Progressive Corp.'], ['PH', 'Parker-Hannifin'], ['PNC', 'PNC Financial Services'], ['PSA', 'Public Storage'],
  ['REGN', 'Regeneron Pharmaceuticals'], ['ROP', 'Roper Technologies'], ['ROST', 'Ross Stores'], ['SCHW', 'Charles Schwab'], ['SHW', 'Sherwin-Williams'],
  ['SPGI', 'S&P Global'], ['SYK', 'Stryker Corp.'], ['TFC', 'Truist Financial'], ['TJX', 'TJX Companies'], ['TMO', 'Thermo Fisher Scientific'],
  ['TRV', 'Travelers Companies'], ['UBER', 'Uber Technologies'], ['UNH', 'UnitedHealth Group'], ['USB', 'U.S. Bancorp'], ['VLO', 'Valero Energy'],
  ['WM', 'Waste Management'], ['ZTS', 'Zoetis'], ['ADSK', 'Autodesk'], ['ANET', 'Arista Networks'], ['APP', 'AppLovin'],
  ['ARM', 'Arm Holdings'], ['ASML2', 'ASML Holding'], ['TEAM', 'Atlassian'], ['DDOG', 'Datadog'], ['MDB', 'MongoDB'],
  ['NET', 'Cloudflare'], ['SNOW', 'Snowflake'], ['PLTR', 'Palantir Technologies'], ['SHOP', 'Shopify'], ['SQ', 'Block Inc.'],
  ['MELI', 'MercadoLibre'], ['SE', 'Sea Ltd.'], ['JD', 'JD.com'], ['NTES', 'NetEase'], ['TCOM', 'Trip.com Group'],
  ['TSM', 'Taiwan Semiconductor Manufacturing'], ['UMC', 'United Microelectronics'], ['INFY', 'Infosys'], ['WIT', 'Wipro'], ['HDB', 'HDFC Bank'],
  ['IBN', 'ICICI Bank'], ['MUFG', 'Mitsubishi UFJ Financial Group'], ['SMFG', 'Sumitomo Mitsui Financial Group'], ['DB', 'Deutsche Bank'], ['UBS', 'UBS Group'],
  ['ING', 'ING Groep'], ['SAN', 'Banco Santander'], ['BBVA', 'Banco Bilbao Vizcaya Argentaria'], ['BNPQY', 'BNP Paribas'], ['ALIZY', 'Allianz SE'],
  ['SIEGY', 'Siemens AG'], ['BASFY', 'BASF SE'], ['BAYRY', 'Bayer AG'], ['DTEGY', 'Deutsche Telekom'], ['AIR.PA', 'Airbus SE'],
  ['OR.PA', 'L’Oréal'], ['MC.PA', 'LVMH'], ['SU.PA', 'Schneider Electric'], ['RMS.PA', 'Hermès International'], ['NESN.SW', 'Nestlé SA'],
  ['ROG.SW', 'Roche Holding'], ['NOVN.SW', 'Novartis'], ['SHEL.L', 'Shell plc'], ['ULVR.L', 'Unilever plc'], ['AZN.L', 'AstraZeneca plc'],
  ['REL.L', 'RELX plc'], ['RIO.L', 'Rio Tinto plc'], ['BHP.AX', 'BHP Group'], ['CBA.AX', 'Commonwealth Bank of Australia'], ['CSL.AX', 'CSL Ltd.'],
];

const currencies: Record<string, string> = {
  USD: 'US Dollar', EUR: 'Euro', GBP: 'British Pound', JPY: 'Japanese Yen', AUD: 'Australian Dollar', CAD: 'Canadian Dollar',
  CHF: 'Swiss Franc', NZD: 'New Zealand Dollar', NOK: 'Norwegian Krone', SEK: 'Swedish Krona', DKK: 'Danish Krone',
  PLN: 'Polish Zloty', CZK: 'Czech Koruna', HUF: 'Hungarian Forint', RON: 'Romanian Leu', TRY: 'Turkish Lira',
  ZAR: 'South African Rand', MXN: 'Mexican Peso', BRL: 'Brazilian Real', SGD: 'Singapore Dollar', HKD: 'Hong Kong Dollar',
  CNH: 'Offshore Chinese Yuan', INR: 'Indian Rupee', KRW: 'South Korean Won', THB: 'Thai Baht', ILS: 'Israeli New Shekel',
  AED: 'UAE Dirham', SAR: 'Saudi Riyal',
};

function buildForexCandidates(): AssetCatalogCandidate[] {
  const priorityBases = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'NZD'];
  const all = Object.keys(currencies);
  const result: AssetCatalogCandidate[] = [];
  for (const base of priorityBases) {
    for (const quote of all) {
      if (base === quote) continue;
      result.push(c(`${base}${quote}`, `${currencies[base]} / ${currencies[quote]}`, 'forex', 'currency-pair', 'traditional-provenance', [`${base}/${quote}`]));
    }
  }
  return result;
}

const commoditySeeds: Array<[string, string]> = [
  ['CMD_GOLD_COMEX', 'COMEX Gold Futures'], ['CMD_SILVER_COMEX', 'COMEX Silver Futures'], ['CMD_COPPER_COMEX', 'COMEX Copper Futures'],
  ['CMD_PLATINUM_NYMEX', 'NYMEX Platinum Futures'], ['CMD_PALLADIUM_NYMEX', 'NYMEX Palladium Futures'], ['CMD_ALUMINUM_LME', 'LME Aluminium'],
  ['CMD_NICKEL_LME', 'LME Nickel'], ['CMD_ZINC_LME', 'LME Zinc'], ['CMD_LEAD_LME', 'LME Lead'], ['CMD_TIN_LME', 'LME Tin'],
  ['CMD_IRONORE_SGX', 'SGX Iron Ore 62% Fe Futures'], ['CMD_REBAR_SHFE', 'SHFE Steel Rebar Futures'], ['CMD_HRC_CME', 'CME U.S. Midwest Hot-Rolled Coil Steel Futures'],
  ['CMD_COBALT_LME', 'LME Cobalt'], ['CMD_LITHIUM_CME', 'CME Lithium Hydroxide Futures'], ['CMD_MOLYBDENUM_LME', 'LME Molybdenum'],
  ['CMD_URANIUM_CME', 'CME UxC Uranium U3O8 Futures'], ['CMD_RHODIUM_SPOT', 'Rhodium Spot'], ['CMD_IRIDIUM_SPOT', 'Iridium Spot'], ['CMD_RUTHENIUM_SPOT', 'Ruthenium Spot'],
  ['CMD_NEODYMIUM_SPOT', 'Neodymium Spot'], ['CMD_DYSPROSIUM_SPOT', 'Dysprosium Spot'], ['CMD_SILICON_SPOT', 'Silicon Metal Spot'], ['CMD_MANGANESE_SPOT', 'Manganese Ore Spot'],
  ['CMD_MAGNESIUM_SPOT', 'Magnesium Metal Spot'], ['CMD_WTI_NYMEX', 'NYMEX WTI Crude Oil Futures'], ['CMD_BRENT_ICE', 'ICE Brent Crude Futures'],
  ['CMD_DUBAI_PLATTS', 'Dubai Crude Benchmark'], ['CMD_OMAN_DME', 'DME Oman Crude Oil Futures'], ['CMD_MARS_ARGUS', 'Mars Sour Crude Benchmark'],
  ['CMD_WCS', 'Western Canadian Select Crude'], ['CMD_URALS', 'Urals Crude Oil Benchmark'], ['CMD_ESPO', 'ESPO Blend Crude Benchmark'],
  ['CMD_HENRYHUB_NYMEX', 'NYMEX Henry Hub Natural Gas Futures'], ['CMD_TTF_ICE', 'ICE Dutch TTF Natural Gas Futures'], ['CMD_JKM', 'Platts JKM LNG Benchmark'],
  ['CMD_PROPANE_CME', 'CME Mont Belvieu Propane Futures'], ['CMD_BUTANE_CME', 'CME Mont Belvieu Normal Butane Futures'], ['CMD_RBOB_NYMEX', 'NYMEX RBOB Gasoline Futures'],
  ['CMD_ULSD_NYMEX', 'NYMEX ULSD Futures'], ['CMD_GASOIL_ICE', 'ICE Low Sulphur Gasoil Futures'], ['CMD_JETFUEL', 'Jet Fuel Benchmark'],
  ['CMD_ETHANOL_CME', 'CME Ethanol Futures'], ['CMD_METHANOL_CME', 'CME Methanol Futures'], ['CMD_NAPHTHA', 'Naphtha Benchmark'],
  ['CMD_NEWCASTLE_COAL', 'Newcastle Thermal Coal Futures'], ['CMD_API2_COAL', 'API2 Rotterdam Coal Futures'], ['CMD_COKING_COAL_SGX', 'SGX Coking Coal Futures'],
  ['CMD_CORN_CBOT', 'CBOT Corn Futures'], ['CMD_WHEAT_CBOT', 'CBOT Soft Red Winter Wheat Futures'], ['CMD_WHEAT_KC', 'CBOT KC Hard Red Winter Wheat Futures'],
  ['CMD_WHEAT_MGE', 'MGEX Hard Red Spring Wheat Futures'], ['CMD_SOYBEAN_CBOT', 'CBOT Soybean Futures'], ['CMD_SOYMEAL_CBOT', 'CBOT Soybean Meal Futures'],
  ['CMD_SOYOIL_CBOT', 'CBOT Soybean Oil Futures'], ['CMD_OATS_CBOT', 'CBOT Oats Futures'], ['CMD_RICE_CBOT', 'CBOT Rough Rice Futures'],
  ['CMD_CANOLA_ICE', 'ICE Canola Futures'], ['CMD_RAPESEED_EURONEXT', 'Euronext Rapeseed Futures'], ['CMD_BARLEY', 'Feed Barley Benchmark'],
  ['CMD_MAIZE_SAFEX', 'SAFEX White Maize Futures'], ['CMD_MAIZEY_SAFEX', 'SAFEX Yellow Maize Futures'], ['CMD_SUGAR11_ICE', 'ICE Sugar No. 11 Futures'],
  ['CMD_SUGAR5_ICE', 'ICE White Sugar No. 5 Futures'], ['CMD_COFFEE_C_ICE', 'ICE Coffee C Futures'], ['CMD_ROBUSTA_ICE', 'ICE Robusta Coffee Futures'],
  ['CMD_COCOA_NY', 'ICE U.S. Cocoa Futures'], ['CMD_COCOA_LONDON', 'ICE London Cocoa Futures'], ['CMD_COTTON2_ICE', 'ICE Cotton No. 2 Futures'],
  ['CMD_ORANGEJUICE_ICE', 'ICE Frozen Concentrated Orange Juice Futures'], ['CMD_LUMBER_CME', 'CME Lumber Futures'], ['CMD_RUBBER_SGX', 'SGX TSR20 Rubber Futures'],
  ['CMD_RUBBER_OSE', 'OSE Rubber Futures'], ['CMD_PALMOIL_BMD', 'Bursa Malaysia Crude Palm Oil Futures'], ['CMD_OLIVEOIL', 'Extra Virgin Olive Oil Benchmark'],
  ['CMD_SUNFLOWEROIL', 'Sunflower Oil Benchmark'], ['CMD_COCONUTOIL', 'Coconut Oil Benchmark'], ['CMD_MILK3_CME', 'CME Class III Milk Futures'],
  ['CMD_MILK4_CME', 'CME Class IV Milk Futures'], ['CMD_BUTTER_CME', 'CME Butter Futures'], ['CMD_CHEESE_CME', 'CME Cheese Futures'],
  ['CMD_DRYWHEY_CME', 'CME Dry Whey Futures'], ['CMD_NONFATMILK_CME', 'CME Nonfat Dry Milk Futures'], ['CMD_LIVECATTLE_CME', 'CME Live Cattle Futures'],
  ['CMD_FEEDERCATTLE_CME', 'CME Feeder Cattle Futures'], ['CMD_LEANHOGS_CME', 'CME Lean Hogs Futures'], ['CMD_PORKCUTOUT_CME', 'CME Pork Cutout Futures'],
  ['CMD_WOOL_AWEX', 'Australian Wool Exchange Eastern Market Indicator'], ['CMD_CASHMERE', 'Cashmere Fibre Benchmark'], ['CMD_PULP_NORESKOG', 'Northern Bleached Softwood Kraft Pulp Benchmark'],
  ['CMD_CONTAINER_FBX', 'Freightos Baltic Global Container Index'], ['CMD_BALTIC_DRY', 'Baltic Dry Index Freight Benchmark'], ['CMD_EUA_ICE', 'ICE EU Allowance Futures'],
  ['CMD_UKA_ICE', 'ICE UK Allowance Futures'], ['CMD_RGGI_ICE', 'ICE RGGI CO2 Allowance Futures'], ['CMD_LNG_TTF_SPREAD', 'JKM-TTF LNG Spread Benchmark'],
  ['CMD_UREA', 'Urea Fertilizer Benchmark'], ['CMD_DAP', 'DAP Fertilizer Benchmark'], ['CMD_AMMONIA', 'Ammonia Benchmark'], ['CMD_POTASH', 'Potash Benchmark'],
];

const indexSeeds: Array<[string, string, string[]?]> = [
  ['NDX', 'NASDAQ-100', ['^NDX']], ['OEX', 'S&P 100', ['^OEX']], ['MID', 'S&P MidCap 400', ['^MID']], ['SML', 'S&P SmallCap 600', ['^SML']],
  ['SP500EW', 'S&P 500 Equal Weight Index'], ['SP500G', 'S&P 500 Growth Index'], ['SP500V', 'S&P 500 Value Index'], ['NYA', 'NYSE Composite', ['^NYA']],
  ['SOX', 'PHLX Semiconductor Sector Index', ['^SOX']], ['BKX', 'KBW Nasdaq Bank Index'], ['DJT', 'Dow Jones Transportation Average'], ['DJU', 'Dow Jones Utility Average'],
  ['RUI', 'Russell 1000 Index'], ['RUA', 'Russell 3000 Index'], ['RLG', 'Russell 1000 Growth Index'], ['RLV', 'Russell 1000 Value Index'],
  ['RMC', 'Russell Midcap Index'], ['ATX', 'Austrian Traded Index'], ['BEL20', 'BEL 20'], ['AEX', 'AEX Index'],
  ['OMXS30', 'OMX Stockholm 30'], ['OMXC25', 'OMX Copenhagen 25'], ['OBX', 'OBX Index'], ['WIG20', 'WIG20'],
  ['PX', 'PX Index'], ['BUX', 'BUX Index'], ['BET', 'BET Index'], ['ISEQ', 'ISEQ Overall Index'], ['PSI20', 'PSI 20'],
  ['XU100', 'BIST 100'], ['TASI', 'Tadawul All Share Index'], ['DFMGI', 'DFM General Index'], ['ADXGI', 'ADX General Index'], ['QE', 'QE Index'],
  ['EGX30', 'EGX 30'], ['JTOPI', 'FTSE/JSE All Share Index'], ['JSE40', 'FTSE/JSE Top 40 Index'], ['MASI', 'MASI Morocco'], ['TUNINDEX', 'Tunindex'],
  ['GSECI', 'GSE Composite Index'], ['NIFTY50', 'NIFTY 50'], ['NIFTYBANK', 'NIFTY Bank'], ['NIFTYIT', 'NIFTY IT'], ['NIFTYMID150', 'NIFTY Midcap 150'],
  ['NIFTYSMALL250', 'NIFTY Smallcap 250'], ['SENSEX', 'BSE SENSEX'], ['BSE100', 'BSE 100'], ['TOPIX', 'TOPIX'], ['JPX400', 'JPX-Nikkei Index 400'],
  ['TOPIX100', 'TOPIX 100'], ['TOPIX500', 'TOPIX 500'], ['MOTHERS', 'Tokyo Stock Exchange Growth Market 250 Index'], ['CSI300', 'CSI 300'], ['CSI500', 'CSI 500'],
  ['CSI1000', 'CSI 1000'], ['SZCOMP', 'Shenzhen Component Index'], ['CHINEXT', 'ChiNext Index'], ['STAR50', 'SSE STAR Market 50'], ['HSCEI', 'Hang Seng China Enterprises Index'],
  ['HSTECH', 'Hang Seng TECH Index'], ['KOSPI200', 'KOSPI 200'], ['KOSDAQ', 'KOSDAQ Composite'], ['TAIEX50', 'FTSE TWSE Taiwan 50 Index'], ['TWOTC', 'Taipei Exchange Capitalization Weighted Stock Index'],
  ['SET', 'SET Index'], ['SET50', 'SET50 Index'], ['VNINDEX', 'VN-Index'], ['VN30', 'VN30 Index'], ['PSEI', 'PSEi'],
  ['FBMKLCI', 'FTSE Bursa Malaysia KLCI'], ['SRIKEHATI', 'SRI-KEHATI Index'], ['IDX30', 'IDX30'], ['ASX50', 'S&P/ASX 50'], ['ASX100', 'S&P/ASX 100'],
  ['ASX300', 'S&P/ASX 300'], ['NZX20', 'S&P/NZX 20'], ['NZX10', 'S&P/NZX 10'], ['IPSA', 'S&P IPSA'], ['MERVAL', 'S&P MERVAL'],
  ['COLCAP', 'MSCI COLCAP'], ['SPBLPGPT', 'S&P/BVL Peru General Index'], ['IBVC', 'Índice Bursátil de Capitalización'], ['CRSMBCT', 'S&P/BMV IPC CompMx'], ['TSX60', 'S&P/TSX 60'],
  ['TSXCOMP', 'S&P/TSX Composite'], ['SPTSXVENT', 'S&P/TSX Venture Composite'], ['MERV25', 'S&P MERVAL 25'], ['EUROSTOXX', 'STOXX Europe 600'], ['STOXX600BANKS', 'STOXX Europe 600 Banks'],
  ['STOXX600TECH', 'STOXX Europe 600 Technology'], ['STOXX600HEALTH', 'STOXX Europe 600 Health Care'], ['MSCIWORLD', 'MSCI World Index'], ['MSCIEAFE', 'MSCI EAFE Index'], ['MSCIEFM', 'MSCI Emerging Markets Index'],
  ['MSCIACWI', 'MSCI ACWI'], ['FTSEALLWORLD', 'FTSE All-World Index'], ['FTSEDEV', 'FTSE Developed Index'], ['FTSEEM', 'FTSE Emerging Index'], ['SPEURO350', 'S&P Europe 350'],
  ['SPASIA50', 'S&P Asia 50'], ['SPGLOBAL1200', 'S&P Global 1200'], ['DOWGLOBAL', 'Dow Jones Global Index'], ['NASDAQGLOBAL', 'NASDAQ Global Index'], ['MSCIUSA', 'MSCI USA Index'],
  ['MSCIEUROPE', 'MSCI Europe Index'], ['MSCIPACIFIC', 'MSCI Pacific Index'], ['MSCIJAPAN', 'MSCI Japan Index'], ['MSCICANADA', 'MSCI Canada Index'], ['MSCIAUSTRALIA', 'MSCI Australia Index'],
];

const bondMarkets: Array<[string, string]> = [
  ['US', 'United States Treasury'], ['DE', 'German Federal Government'], ['GB', 'United Kingdom Gilt'], ['FR', 'French OAT'], ['IT', 'Italian BTP'],
  ['ES', 'Spanish Government'], ['NL', 'Dutch Government'], ['BE', 'Belgian Government'], ['AT', 'Austrian Government'], ['FI', 'Finnish Government'],
  ['IE', 'Irish Government'], ['PT', 'Portuguese Government'], ['GR', 'Greek Government'], ['CH', 'Swiss Confederation'], ['JP', 'Japanese Government Bond'],
  ['AU', 'Australian Commonwealth Government'], ['CA', 'Government of Canada'], ['NZ', 'New Zealand Government'], ['SE', 'Swedish Government'], ['NO', 'Norwegian Government'],
];
const bondTenors = ['2Y', '5Y', '10Y', '20Y', '30Y'] as const;

function buildBondCandidates(): AssetCatalogCandidate[] {
  const result: AssetCatalogCandidate[] = [];
  for (const [country, name] of bondMarkets) {
    for (const tenor of bondTenors) {
      result.push(c(`GB_${country}_${tenor}`, `${name} ${tenor} Benchmark Yield`, 'bond', 'government-benchmark-yield', 'catalog-only'));
    }
  }
  return result;
}

export const ASSET_CATALOG_EXPANSION: Record<AssetCatalogType, AssetCatalogCandidate[]> = {
  crypto: cryptoSeeds.map(([symbol, name]) => ({ ...c(symbol, name, 'crypto', 'digital-asset', 'crypto-provenance'), subtype: 'standard' })),
  stock: stockSeeds.map(([symbol, name]) => c(symbol, name, 'stock', 'equity', 'traditional-provenance')),
  forex: buildForexCandidates(),
  commodity: commoditySeeds.map(([symbol, name]) => c(symbol, name, 'commodity', 'commodity-benchmark', 'catalog-only')),
  index: indexSeeds.map(([symbol, name, aliases]) => c(symbol, name, 'index', 'market-index', 'traditional-provenance', aliases)),
  bond: buildBondCandidates(),
};

export const ASSET_CATALOG_TARGET_ADDITIONS: Record<AssetCatalogType, number> = {
  crypto: 100,
  stock: 100,
  forex: 100,
  commodity: 100,
  index: 100,
  bond: 100,
};
