import React, { useState } from 'react';
import { KeyContextProvider, useKeyContext } from 'react-key-context';

// --- Consumers ---

const CountDisplay = ({ label = "Value", k }: { label?: string, k: string }) => {
  const value = useKeyContext<number>(k);
  
  // Visual feedback for render
  const renderCount = React.useRef(0);
  renderCount.current++;

  return (
    <div className="card">
      <h3>{label}</h3>
      <div>Key: <code>{k}</code></div>
      <div>Value: <span className="value-display">{value !== undefined ? value : 'undefined'}</span></div>
      <div style={{fontSize: '0.8em', opacity: 0.5, marginTop: '0.5em'}}>
        Render Count: {renderCount.current}
      </div>
    </div>
  );
};

const UserDisplay = () => {
  const user = useKeyContext<{name: string}>("currentUser");
  return (
    <div className="card">
      <h3>User Profile</h3>
      {user ? (
        <>
          <div>Hello, <b>{user.name}</b></div>
        </>
      ) : (
        <div className="error">No User Logged In</div>
      )}
    </div>
  );
};

// --- Main Demo ---

function App() {
  const [globalCount, setGlobalCount] = useState(123);
  const [localCount, setLocalCount] = useState(456);
  const [showChild, setShowChild] = useState(true);

  return (
    <KeyContextProvider keyName="globalCount" value={globalCount}>
      <KeyContextProvider keyName="currentUser" value={{ name: "Alice" }}>
        
        <h1>react-key-context Demo</h1>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          
          <div className="section">
            <h2>Global Scope</h2>
            <button onClick={() => setGlobalCount(c => c + 1)}>
              Increment Global ({globalCount})
            </button>
            <CountDisplay label="Global Consumer" k="globalCount" />
            <UserDisplay />
          </div>

          <div className="section">
            <h2>Nested Scope (Shadowing)</h2>
            <KeyContextProvider keyName="globalCount" value={localCount}>
              <div style={{ border: '1px dashed #666', padding: '1rem', borderRadius: '8px' }}>
                <p>Inside nested provider for 'globalCount'</p>
                <button onClick={() => setLocalCount(c => c + 1)}>
                  Increment Nested ({localCount})
                </button>
                
                {/* Should read LOCAL value */}
                <CountDisplay label="Shadowed Consumer" k="globalCount" />
                
                {/* Should still read GLOBAL user, traversing up */}
                <UserDisplay />
              </div>
            </KeyContextProvider>
          </div>

        </div>

        <div className="section">
             <h2>Dynamic Tree Updates</h2>
             <button onClick={() => setShowChild(!showChild)}>
                Toggle Child Mount
             </button>
             {showChild && (
                <KeyContextProvider keyName="dynamicKey" value={999}>
                    <CountDisplay label="Dynamic Child" k="dynamicKey" />
                </KeyContextProvider>
             )}
        </div>

      </KeyContextProvider>
    </KeyContextProvider>
  );
}

export default App;
