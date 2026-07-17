import React, { useState, useEffect } from 'react';
import { processAssets } from './logic.js';

function Dashboard() {
  const [assets, setAssets] = useState([]);
  const [currentFilter, setCurrentFilter] = useState('all');
  const [error, setError] = useState(null);

  const loadAssets = async () => {
    try {
      const response = await fetch('/api/assets');
      if (!response.ok) {
        throw new Error(`could not load assets: ${response.status}`);
      }
      const data = await response.json();
      const processed = processAssets(data);
      setAssets(processed);
      setError(null);
    } catch (err) {
      alert(err.message);
      setError(err.message);
    }
  };

  useEffect(() => {
    loadAssets();
  }, []);

  const handleFilterChange = (e) => {
    setCurrentFilter(e.target.value);
  };

  const handleRefresh = () => {
    loadAssets();
  };

  const filteredAssets = assets.filter(asset => {
    if (currentFilter === 'all') return true;
    return asset.riskLevel === currentFilter;
  });

  const getRowClass = (riskLevel) => {
    if (riskLevel === 'high') return 'row-danger';
    if (riskLevel === 'medium') return 'row-warn';
    return 'row-ok';
  };

  return (
    <div>
      <div>
        <select id="filter-select" value={currentFilter} onChange={handleFilterChange}>
          <option value="all">All</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <button id="refresh-btn" onClick={handleRefresh}>Refresh</button>
      </div>
      <table id="asset-table">
        <tbody>
          {filteredAssets.map((asset) => (
            <tr key={asset.id} className={getRowClass(asset.riskLevel)}>
              <td>{asset.id}</td>
              <td>{asset.name}</td>
              <td>{asset.category}</td>
              <td>{asset.daysSinceCheck}</td>
              <td>{asset.riskLevel.toUpperCase()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Dashboard;
