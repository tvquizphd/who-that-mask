import React, { Component } from 'react';
import {Pokedex} from 'pokeapi-js-wrapper';
import SobelFilter from './SobelFilter';
import Output from './Output.js';
import {
  constMapInsert, constListReplace
} from '../functions/ConstUpdaters';

const GENERATIONS = [
  '','i','ii','iii','iv','v','vi','vii','viii', // as of 2021
  'ix', 'x', 'xi', 'xii', 'xiii', 'xiv', 'xv', // until ~2042
  'xvi', 'xvii', 'xviii', 'xix', 'xx', 'xxi' // until ~2060
];

const parseLangList = (list, property) => {
  const extractor = (langMap, lang) => {
    const value = lang[property];
    const {language} = lang;
    const key = language.name;
    if (key && value) {
      langMap.set(key, value);
    }
    return langMap;
  }
  return list.reduce(extractor, new Map([]));
}

const parseGeneration = (generation) => {
  const roman = generation.split('-').slice(-1)[0].toLowerCase();
  return GENERATIONS.indexOf(roman) || 0;
}

class Pokemon {
  constructor(params) {
    const {name, id, names, genera, varieties} = params;
    this.id = id;
    this.name = name;
    this.nameLangMap = parseLangList(names, 'name');
    this.genusLangMap = parseLangList(genera, 'genus');
    this.hasGenderDiff = params.has_gender_differences || false;
    this.hasGender = (params.gender_rate || 0) !== -1;
    this.generation = parseGeneration(params.generation?.name || '');
    // Each pokemon species may have multiple varieties
    const {vMap, vDefault} = varieties.reduce((result, variety) => {
      const value = variety.pokemon || {};
      if (value.name) {
        if (variety.is_default) {
          result.vDefault = value.name;
        }
        result.vMap.set(value.name, {
          // Each variety may have many sprites
          sprites: []
        });
      }
      return result;
    }, {
      vDefault: null,
      vMap: new Map([])
    });
    this.varietyMap = vMap;
    this.varietyDefault = vDefault;
  }
  getName(lang) {
    return this.nameLangMap.get(lang) || this.name;
  }
  getGenus(lang) {
    return this.genusLangMap.get(lang) || null;
  }

  newSpriteList(sprite, label, url) {
    const splitLabel = label.split('_');
    const [side, gender] = splitLabel;
    if (splitLabel.length !== 2 || !url) {
      return [];
    }
    // ignore shiny or grayscale sprites
    if (['shiny', 'gray'].includes(gender)) {
      return [];
    }
    return [{
      ...sprite,
      gender: {
        'default': this.hasGender ? 'male' : 'none'
      }[gender] || gender,
      canvas: null,
      side: side,
      url: url
    }];
  }

  parseSpriteData(spriteData) {
    return Object.entries(spriteData || {}).reduce((l0, [k0, v0])=>{
      if (k0 === 'other') {
        return Object.entries(v0 || {}).reduce((l1, [k1, v1]) => {
          return Object.entries(v1 || {}).reduce((l2, [k2, v2]) => {
            return l2.concat(this.newSpriteList({
                generation: {
                  'dream_world': 5
                }[k1] || this.generation,
                source: k1
              }, k2, v2
            ));
          }, l1);
        }, l0);
      }
      else if (k0 === 'versions') {
        return Object.entries(v0 || {}).reduce((l1, [k1, v1]) => {
          return Object.entries(v1 || {}).reduce((l2, [k2, v2]) => {
            return Object.entries(v2 || {}).reduce((l3, [k3, v3]) => {
              if (k2 === 'icons') {
                return l3;
              }
              return l3.concat(this.newSpriteList({
                  generation: parseGeneration(k1),
                  source: k2
                }, k3, v3
              ));
            }, l2);
          }, l1);
        }, l0);
      }
      return l0.concat(this.newSpriteList({
          generation: 0,
          source: 'default'
        }, k0, v0
      ));
    },[]).sort((...ab) => {
      const sortChoices = (items, key, choices=null) => {
        return () => {
          const [a,b] = items.slice(0,2).map((item) => {
            if (choices === null) {
              return item[key];
            }
            const choiceIndex = choices.indexOf(item[key]);
            return choiceIndex !== -1 ? choiceIndex : choices.length;
          });
          return a - b;
        }
      }
      const functions = [
        sortChoices(ab, 'side', [
          'front', 'back'
        ]),
        sortChoices(ab, 'source', [
          'official-artwork', 'dream_world', 'default'
        ]),
        sortChoices(ab, 'generation', null),
        sortChoices(ab, 'gender', [
          'none', 'female', 'male'
        ]),
      ]
      for (let fn of functions) {
        const diff = fn();
        if (diff !== 0) {
          return diff;
        }
      }
      return 0;
    });
  }

  setSprites(variety, sprites) {
    this.varietyMap = constMapInsert(this.varietyMap, variety, {
      sprites: sprites
    });
    return this.getSprites(variety);
  }

  setSprite(variety, spriteIndex=0, sprite=null) {
    if (sprite) {
      const sprites = constListReplace(
        this.getSprites(variety), spriteIndex, sprite
      );
      this.setSprites(variety, sprites);
    }
    return this.getSprite(variety, spriteIndex);
  }

  getSprites(variety) {
    const varietyState = this.varietyMap.get(variety) || {};
    return varietyState.sprites || [];
  }

  getSprite(variety, index=0) {
    return this.getSprites(variety)[index] || null;
  }

  loadSprite(variety, index=0) {
    return new Promise((resolve, reject) => {
      const sprite = this.getSprite(variety, index=0) || {};
      const url = sprite.url || '';
      if (!url) {
        reject({url: ''});
      }

      const spriteImage = new Image();
      spriteImage.crossOrigin = "Anonymous";
      spriteImage.onload = async () => {
        const canvas = document.createElement('canvas');
        canvas.width = spriteImage.width;
        canvas.height = spriteImage.height;
        canvas.getContext('2d').drawImage(spriteImage,0,0);
        resolve({
          ...sprite,
          canvas: canvas
        });
      };
      spriteImage.onerror = () => {
        const noUrl = !url.length;
        const what = 'sprite url';
        reject(new SpriteException(
          [`Invalid ${what}: ${url}`, `No ${what}`][+noUrl]
        ));
      }
      spriteImage.src = url; 
    });
  }

  readSpriteMaskPixel(variety, index=0, x, y) {
    const {canvas} = this.getSprite(variety, index) || {};
    if (!canvas) {
      return false;
    }
    const context = canvas.getContext('2d');
    const {data} = context.getImageData(x, y, 1, 1) || {};
    if (!data) {
      return false;
    }
    // Truee if greater than half alpha
    return data[3] >= 127;
  }
}

const makeEmptyPokemon = () => {
  return new Pokemon({
    id: 0,
    name: '',
    names: [
      {"language":{"name":"de"},"name":"MissingNo."},
      {"language":{"name":"en"},"name":"MissingNo."},
      {"language":{"name":"es"},"name":"MissingNo."},
      {"language":{"name":"fr"},"name":"MissingNo."},
      {"language":{"name":"it"},"name":"MissingNo."},
      {"language":{"name":"ja"},"name":"けつばん"},
      {"language":{"name":"ja-Hrkt"},"name":"けつばん"},
      {"language":{"name":"ko"},"name":"미싱노"},
      {"language":{"name":"roomaji"},"name":"Ketsuban"},
      {"language":{"name":"zh-Hans"},"name":"MissingNo."},
      {"language":{"name":"zh-Hant"},"name":"MissingNo."}
    ],
    genera: [],
    varieties: [],
    gender_rate: -1,
    generation: 'i',
    has_gender_differences: false
  });
}

const parseAbsoluteInteger = (v, alt=null) => {
  return ((i)=> !isNaN(i) ? Math.abs(i) : alt)(parseInt(v));
}

function DexException(message) {
  this.name = 'DexException';
  this.message = message;
}

function SpriteException(message) {
  this.name = 'SpriteException';
  this.message = message;
}

class DexOutput extends Component {
  constructor(props) {
    super(props);
    this.state = {
      lang: 'en',
      variety: null,
      spriteIndex: 0,
      pokemon: makeEmptyPokemon()
    };
    this.dex = new Pokedex();
    this.missing = [
      [0,0,0,0,0,0,0,0,0],
      [0,0,0,0,1,1,1,0,0],
      [0,0,0,0,1,1,1,0,0],
      [0,0,0,0,1,1,1,0,0],
      [0,0,0,0,1,1,1,0,0],
      [0,0,0,0,1,1,1,0,0],
      [0,0,1,1,1,1,1,0,0],
      [0,0,1,1,1,1,1,0,0],
      [0,0,1,1,1,1,1,0,0],
      [0,0,1,1,1,1,1,0,0],
      [0,0,1,1,1,1,1,0,0],
      [0,0,1,1,1,1,1,0,0],
      [0,0,1,1,1,1,1,0,0],
      [0,0,1,1,1,1,1,0,0],
      [0,0,0,0,0,0,0,0,0],
    ];
    this.readMaskPixel = this.readMaskPixel.bind(this);
    this.readMaskShape = this.readMaskShape.bind(this);
  }

  componentDidMount() {
    const {n} = this.props;
    const {variety, spriteIndex} = this.state;
    // This call is non-blocking
    this.loadPokemon(n, variety, spriteIndex);
  }

  componentDidUpdate() {
    const {n} = this.props;
    const {variety, spriteIndex} = this.state;
    // This call is non-blocking
    this.loadPokemon(n, variety, spriteIndex);
  }

  isSameSpecies(pokemonOrNameOrNumber) {
    // Flexible type for input
    const n = ((value) => {
      if (value instanceof Pokemon) {
        return value.id;
      }
      return value;
    })(pokemonOrNameOrNumber);

    return this.spriteCall(({p}) => {
      return [p.name, p.id].includes(n);
    });
  }

  isSameVariety(pokemon, variety) {
    if (!this.isSameSpecies(pokemon)) {
      return false;
    }
    return this.spriteCall(({v}) => {
      return v === variety;
    })
  }

  isSameSprite(pokemon, variety, spriteIndex) {
    if (!this.isSameVariety(pokemon, variety)) {
      return false;
    }
    return this.spriteCall(({s}) => {
      return s === spriteIndex;
    })
  }

  async loadPokemonSpecies(n) {
    const nNumber = parseAbsoluteInteger(n, NaN);
    const isZero = nNumber === 0;
    const isEmpty = n.length === 0;
    if (isEmpty) {
      throw new DexException('No species name or dex number!');
    }
    if (isZero) {
      throw new DexException('Invalid dex number!');
    }
    const nameOrNumber = isNaN(nNumber)? n.toLowerCase() : nNumber;
    const newSpecies = !this.isSameSpecies(nameOrNumber);
    // Don't bother reloading the same species
    const pokemon = newSpecies? new Pokemon(
      await this.dex.getPokemonSpeciesByName(nameOrNumber)
    ) : this.spriteCall(({p}) => p);
    // Always return pokemon
    return pokemon; 
  }

  async loadPokemonSprites(pokemon, variety) {
    // Don't bother reloading the same variety
    if (this.isSameVariety(pokemon, variety)) {
      return pokemon.getSprites(variety);
    }
    return pokemon.parseSpriteData(
      (await this.dex.getPokemonByName(variety)).sprites
    )
  }

  async loadPokemonSprite(pokemon, variety, spriteIndex) {
    // Don't bother reloading the same sprite
    if (this.isSameSprite(pokemon, variety, spriteIndex)) {
      return pokemon.getSprite(variety, spriteIndex);
    }
    return await pokemon.loadSprite(variety, spriteIndex);
  }

  async loadPokemon(n, v=null, spriteIndex=0) {
    const {lang} = this.state;
    const pokemon = await (async () => {
      try {
        return await this.loadPokemonSpecies(n);
      }
      catch (err) {
        console.error(err);
        return makeEmptyPokemon();
      }
    })();
    const validVariety = [
      v, this.isSameSpecies(pokemon)
    ].every(x=>!!x);
    const variety =  validVariety ? v : (
      pokemon.varietyDefault || pokemon.name
    );

    // Don't bother setting state if same sprite
    const sameSprite = this.isSameSprite(
      pokemon, variety, spriteIndex
    );
    if (sameSprite) {
      return false;
    }
    pokemon.setSprites(variety, (
      await (async () => {
        try {
          return await this.loadPokemonSprites(
            pokemon, variety
          );
        }
        catch (err) {
          console.error(err); 
          return pokemon.getSprites(variety);;
        }
      })()
    ));
    pokemon.setSprite(variety, spriteIndex, (
      await (async () => {
        try {
          return await this.loadPokemonSprite(
            pokemon, variety, spriteIndex
          );
        }
        catch (err) {
          console.error(err);
          return null;
        }
      })()
    ));
    this.setState({
      spriteIndex: spriteIndex,
      pokemon: pokemon,
      variety: variety
    });
    this.props.setSpeciesName(pokemon.getName(lang));
    this.props.setSpeciesIndex(pokemon.id);
    return true;
  }

  spriteCall(fn) {
    const {pokemon, variety, spriteIndex} = this.state;
    return fn({
      p: pokemon,
      v: variety,
      s: spriteIndex
    });
  }

  readMaskPixel(x,y) {
    const {canvas} = this.spriteCall(({p,v,s}) => {
      const sprite = p.getSprite(v,s) || {};
      return sprite;
    });
    if (!canvas) {
      return !!this.missing[y][x];
    }
    return this.spriteCall(({p,v,s}) => {
      return p.readSpriteMaskPixel(v,s,x,y);
    });
  }

  readMaskShape() {
    const {canvas} = this.spriteCall(({p,v,s}) => {
      return p.getSprite(v,s) || {};
    });
    if (!canvas) {
      return [
        this.missing[0].length, 
        this.missing.length
      ];
    }
    return [canvas.width, canvas.height];
  }

  render() {
    const {lang} = this.state;
    const {alignment} = this.props;
    const label = this.spriteCall(({p}) => {
      return p.getName(lang) || 'DEX ERR ';
    });

    const output = (
        <Output space=' ' stepSize={100}
          readMaskShape={this.readMaskShape}
          readMaskPixel={this.readMaskPixel}
          label={label.toLocaleLowerCase('en-US')}
          alignment={alignment}
        >
        </Output>
    );
    // TODO
    const {url, canvas} = this.spriteCall(({p,v,s}) => {
      return p.getSprite(v,s) || {};
    });
    return (
      <div>
        {false? output : ''}
        <a href={url || '/'}>
          <SobelFilter
            source={canvas}
            vertex='/vertex.glsl'
            fragment='/fragment.glsl'
          >
          </SobelFilter>
        </a>
      </div>
    )
  }
}
export default DexOutput;
