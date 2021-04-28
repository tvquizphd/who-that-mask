import React, {useState} from "react";
import {
  BrowserRouter as Router,
  useLocation,
  Switch,
  Route,
  Link
} from "react-router-dom";

import styles from './App.module.css';
import UrlOutput from './UrlOutput.js';
import DexOutput from './DexOutput.js';

// Query parameter parsers
const parseBoolean = (v, f=false, t=true) => {
  return v == null ? f: t;
}
const parseAnyString = (v, alt=null) => {
  return [null, ''].includes(v) ? alt : v;
}

const useQuery = (parsers) => {
  const query = new URLSearchParams(useLocation().search);
  // Basically accept any value that doesn't parse as null
  return Object.entries(parsers).reduce((result, [key, parser]) => {
    const value = parser(query.get(key));
    if (value !== null) {
      result[key] = value;
    }
    return result; 
  }, {});
}

const configureProps = (props) => {
  // The slug defines the header and valid query parameters
  return (({slug}) => {
    const parsers = {
      'row': (v) => parseBoolean(v, 'column', 'row') 
    };
    if (slug[0] === 'dex') {
      return {
        navigation: 'dex',
        parsers: {
          ...parsers,
          'n': parseAnyString
        }
      };
    }
    return {
      navigation: 'home',
      parsers: {
        ...parsers,
        'url': (v) => parseAnyString(v)
      }
    };
  })(props);
}

const formatDexLink = (n) => {
  return `/dex?n=${n}`;
}

function RenderOutput(props) {
  const lastPokemon = 898;
  const [speciesIndex, setSpeciesIndex] = useState(NaN);
  const [speciesName, setSpeciesName] = useState('Loading...');

  const config = configureProps(props);
  config.query = useQuery(config.parsers);
  // Configure the navigation
  const header = (({navigation, query}) => {
    if (navigation === 'dex') {
      const nullPokemon = isNaN(speciesIndex);
      const prefix = nullPokemon? `#???` : `#${speciesIndex}`;
      const nextIndex = nullPokemon? 1 : (
        Math.max(1, (speciesIndex + 1) % (lastPokemon + 1))
      );
      const next = formatDexLink(nextIndex);
      return (
        <div className={styles.flex_row}>
          <span>
            <Link to='/'>Home</Link>
          </span>
          <span>
            <strong>{prefix} {speciesName}</strong>
          </span>
          <span>
            Next:  <Link to={next}>#{nextIndex}</Link>
          </span>
        </div>
      );
    }
    const randomIndex = Math.ceil(Math.random() * lastPokemon);
    const random = formatDexLink(randomIndex);
    return (
      <div className={styles.flex_row}>
        <div className={styles.padded_header}>
        Try this Pokémon: <Link to={random}>#{randomIndex}</Link>
        </div>
      </div>
    );
  })(config);

  // Configure the main output
  const output = ((input) => {
    const {query, navigation} = input;
    const alignment = query.row;

    if (navigation === 'dex') {
      const {n} = query;
      return (
        <DexOutput alignment={alignment}
          setSpeciesIndex={setSpeciesIndex}
          setSpeciesName={setSpeciesName}
          n={n || ''}
        ></DexOutput>
      );
    }
    const {url} = query;
    if (!url) {
      return (
        <div className={styles.n898}>
          <div className={styles.flex_column}>
          {[...Array(lastPokemon).keys()].map((i)=> {
            const dexIndex = i + 1;
            const dexLink = formatDexLink(dexIndex);
            return (
              <div key={dexIndex}>
                <Link to={dexLink}>Dex #{dexIndex}</Link>
              </div>
           )
          })}
          </div>
        </div>
      );
    }
    return (
      <UrlOutput alignment={alignment}
        url={url || ''}
      ></UrlOutput>
    );
  })(config);

  return (
    <div>
      <div>
        {header}
      </div>
      <div>
        {output}
      </div>
    </div>
  );
}

function App() {

  return (
    <Router basename={process.env.PUBLIC_URL}>
      <div className="App">
        <Switch>
          <Route path="/dex">
            <RenderOutput slug={['dex']}>
            </RenderOutput>
          </Route>
          <Route path="/">
            <RenderOutput slug={[]}>
            </RenderOutput>
          </Route>
        </Switch>
      </div>
    </Router>
  )
}

export default App;
