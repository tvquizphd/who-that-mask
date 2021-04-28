import React, { Component } from 'react';
import {Pokedex} from 'pokeapi-js-wrapper';
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
    return Object.entries(spriteData).reduce((l0, [k0, v0])=>{
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
      const {url} = sprite;
      if (!url) {
        reject({url: ''});
      }
      const spriteImage = new Image();
      spriteImage.crossOrigin = "Anonymous";
      spriteImage.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = spriteImage.width;
        canvas.height = spriteImage.height;
        canvas.getContext('2d').drawImage(spriteImage,0,0);

        const sprites = constListReplace(this.getSprites(variety), index, {
          ...sprite,
          canvas: canvas
        })
        this.setSprites(variety, sprites);
        resolve(sprite);
      };
      spriteImage.onerror = () => {
        reject({url});
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
  this.message = message;
  this.name = 'DexException';
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
    const {spriteIndex} = this.state;
    // This call is non-blocking
    this.loadPokemon(n, spriteIndex);
  }

  componentDidUpdate() {
    const {n} = this.props;
    const {spriteIndex} = this.state;
    // This call is non-blocking
    this.loadPokemon(n, spriteIndex);
  }

  async loadPokemon(n0, spriteIndex) {
    let mon0 = undefined;
    let mon1 = undefined;
    const missingNo = makeEmptyPokemon();
    const missingName = missingNo.getName(this.state.lang); 
    const nNumber = parseAbsoluteInteger(n0, NaN);
    const isZero = nNumber === 0;
    const isEmpty = n0.length === 0;
    try {
      if (isEmpty) {
        throw new DexException('No species name or dex number!');
      }
      if (isZero) {
        throw new DexException('Invalid dex number!');
      }
      const nameOrNumber = isNaN(nNumber)? n0.toLowerCase() : nNumber;
      mon0 = await this.dex.getPokemonSpeciesByName(nameOrNumber);
    }
    catch (e0) {
      this.props.setSpeciesName(missingName);
      console.error(e0)
    }
    if (mon0) {
      const pokemon = new Pokemon(mon0);
      const variety = pokemon.varietyDefault || pokemon.name;
      try {
        mon1 = await this.dex.getPokemonByName(variety);
      }
      catch (e1) {
        this.props.setSpeciesName(missingName);
        console.error(e1); 
      }
      if (mon1) {
        pokemon.setSprites(variety, pokemon.parseSpriteData(mon1.sprites)) 
      }
      try {
        await pokemon.loadSprite(variety, spriteIndex)
        this.props.setSpeciesName(pokemon.getName(this.state.lang));
        this.props.setSpeciesIndex(pokemon.id);
        this.setState({
          pokemon: pokemon,
          variety: variety
        });
      }
      catch (badSprite) {
        const url = badSprite.url || '';
        const msg = (!url.length)? 'No url!' : `Invalid url: ${url}`;
        this.props.setSpeciesName(missingName);
        console.error(msg);
      }
    }
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

    return (
      <Output space=' ' stepSize={100}
        readMaskShape={this.readMaskShape}
        readMaskPixel={this.readMaskPixel}
        label={label.toLocaleLowerCase('en-US')}
        alignment={alignment}
      >
      </Output>
    )
  }
}
export default DexOutput;
