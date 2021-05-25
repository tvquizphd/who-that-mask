import React, { Component } from 'react';
import {Pokedex} from 'pokeapi-js-wrapper';
import SobelFilter from './SobelFilter';
import Output from './Output.js';
import {
  constMapInsert, constListReplace
} from '../functions/ConstUpdaters';
import {
  rgb2hsv
} from '../functions/Colors';
// TODO RM
import {
  sleepAsync
} from '../functions/Async';

const GENERATIONS = [
  '','i','ii','iii','iv','v','vi','vii','viii', // as of 2021
  'ix', 'x', 'xi', 'xii', 'xiii', 'xiv', 'xv', // until ~2042
  'xvi', 'xvii', 'xviii', 'xix', 'xx', 'xxi' // until ~2060
];

const modeOrMax = (a) => {
  const counts = a.reduce((counts, v) => {
    const count = 1 + (counts.get(v) || 0); 
    return counts.set(v, count);
  }, new Map([]));
  return [...counts].reduce((mode, [v, count]) => {
    const mode_count = (counts.get(mode) || 0);
    if (mode_count === count) {
      return Math.max(v, mode); 
    }
    return (count > mode_count) ? v : mode;
  }, -1);
}

const allWhole = (...args) => {
  return args.reduce((ok, arg) => {
    if (!ok || arg % 1 !== 0 || arg < 0) {
      return false; 
    }
    return true;
  }, true);
}

const palindromeIndex = ({maxCenter, oldSize, newSize, weigh}) => {
  const {midFloor, sideFloor} = ((floor)=> {
    const evenFloor = (floor % 2 === 0);
    return {
      midFloor: Math.max(floor - 1*evenFloor, 1),
      sideFloor: Math.max(floor - 1*(!evenFloor), 1)
    };
  })(Math.floor(newSize / oldSize));
  const sideSum = (newSize - midFloor) / 2;
  const sideLen = (oldSize - 1) / 2;
  const excess = sideSum - sideLen * sideFloor;
  if (!allWhole(midFloor-1, sideFloor-1, excess)){
    throw new SpriteException(
      `Cannot upsample from ${oldSize} to ${newSize}`
    );
  }
  const sideRange = [...Array(sideLen).keys()].sort((a,b) => {
    return Math.sign(weigh(b, sideLen) - weigh(a, sideLen));
  });
  const oldRange = [...Array(oldSize).keys()];
  const excessRange = [...Array(excess).keys()];

  const {
    leftCounts, midCount, rightCounts
  } = excessRange.reduce((out, i) => {
    const index = sideRange[i % sideLen];
    const nextValue = out.rightCounts[index] + 1;
    if (maxCenter && out.midCount < nextValue) {
      if (out.remaining >= 1) {
        out.midCount += 2;
        out.remaining -= 1;
      }
    }
    if (out.remaining >= 1) {
      out.leftCounts[sideLen-1-index] = nextValue;
      out.rightCounts[index] = nextValue;
      out.remaining -= 1;
    }
    return out;
  }, {
    leftCounts: sideRange.map((_)=>sideFloor),
    rightCounts: sideRange.map((_)=>sideFloor),
    remaining: excess,
    midCount: midFloor
  });
  const allCounts = [...leftCounts, midCount, ...rightCounts];
  const allOldIdx = oldRange.reduce(({final, countIdx}, i) => {
    const countRange = [...Array(allCounts[countIdx]).keys()];
    return {
      final: final.concat(countRange.map((_)=>i)),
      countIdx: countIdx + 1
    };
  }, {
    final: [],
    countIdx: 0
  }).final;
  return allOldIdx;
}

const scaleArtKernel = (sources, newSize, char) => {
  const numRange = [...Array(newSize).keys()]
  const rescale = ((quad) => {
    const oldSize = quad.length;
    return {
      wideNear: palindromeIndex({
        maxCenter: true, oldSize, newSize,
        weigh: (idx, len) => len-1-idx
      }),
      wideFar: palindromeIndex({
        maxCenter: false, oldSize, newSize,
        weigh: (idx, len) => idx
      }),
      wideTween: palindromeIndex({
        maxCenter: false, oldSize, newSize,
        weigh: (idx, len) => {
          return Math.min(idx+0.01, len-1-idx);
        }
      }),
    }
  });
  const sourceIdxList = sources.map(source => rescale(source));
  return numRange.map((iy) => {
    return numRange.map((ix) => {
      const options = [].concat(...sources.map((source, si) => {
        const iyTween = sourceIdxList[si].wideTween[iy];
        const ixTween = sourceIdxList[si].wideTween[ix];
        const iyNear = sourceIdxList[si].wideNear[iy];
        const ixNear = sourceIdxList[si].wideNear[ix];
        const iyFar = sourceIdxList[si].wideFar[iy];
        const ixFar = sourceIdxList[si].wideFar[ix];
        return [
          source[iyFar][ixFar],
          source[iyNear][ixNear],
          source[iyTween][ixTween]
        ];
      }));
      return modeOrMax(options);
    });
  });
}

const parseArtPixel = (pixelBuffer, i4) => {
  const [r, g, b] = pixelBuffer.slice(4 * i4, 3 + 4 * (i4));
  const [h, s, v] = rgb2hsv(r, g, b);
  // black 0
  if (v <= (1/255)) {
    return 0;
  }
  // white 1
  if (s <= (1/255)) {
    return 1;
  }
  // red=2, green=3, blue=4
  return 2 + Math.floor((h % 360) / (360 / 3));
}

const maxCharMapWidth = (charMap) => {
  const charList = [...charMap.values()];
  return  charList.reduce((wMax, {w}) => {
    return Math.max(wMax, w);
  }, 1);
}

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
        reject(new SpriteException('No sprite url'));
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
        reject(new SpriteException(`Invalid sprite url: ${url}`));
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

// Convert a string n to a lowercase name or a dex index
const returnValidNameOrNumber = (n) => {
  const nNumber = parseAbsoluteInteger(n, NaN);
  const isZero = nNumber === 0;
  const isEmpty = n.length === 0;
  if (isEmpty) {
    throw new DexException('No species name or dex number!');
  }
  if (isZero) {
    throw new DexException('Invalid dex number!');
  }
  return isNaN(nNumber)? n.toLowerCase() : nNumber;
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

    // TODO RM
    this.todoRef = React.createRef();
    this.sobelRef = React.createRef();
    const artKernels3x3 = {
      ' ': [
        [ 0, 0,-1],
        [ 0, 0,-1],
        [ 0, 0,-1]
      ],
      '|': [
        [ 1, 1,-1],
        [ 1, 1,-1],
        [ 1, 1,-1]
      ],
      '¯': [
        [ 2, 2, 2],
        [-1,-1,-1],
        [-1,-1,-1]
      ],
      '–': [
        [-1,-1,-1],
        [ 2, 2, 2],
        [-1,-1,-1]
      ],
      '_': [
        [-1,-1,-1],
        [-1,-1,-1],
        [ 2, 2, 2],
      ],
      '\\': [
        [ 3,-1,-1],
        [ 3, 3,-1],
        [ 3, 3,-1],
      ],
      '/': [
        [-1, 4,-1],
        [ 4, 4,-1],
        [ 4, 4,-1],
      ],
    };
    const artKernels5x5 = {
      ' ': [
        [ 0, 0, 0,-1,-1],
        [ 0, 0, 0,-1,-1],
        [ 0, 0, 0,-1,-1],
        [ 0, 0, 0,-1,-1],
        [ 0, 0, 0,-1,-1]
      ],
      '|': [
        [ 1, 1, 1,-1,-1],
        [ 1, 1, 1,-1,-1],
        [ 1, 1, 1,-1,-1],
        [ 1, 1, 1,-1,-1],
        [ 1, 1, 1,-1,-1]
      ],
      '¯': [
        [ 2, 2, 2, 2, 2],
        [ 2, 2, 2, 2, 2],
        [-1,-1,-1,-1,-1],
        [-1,-1,-1,-1,-1],
        [-1,-1,-1,-1,-1]
      ],
      '–': [
        [-1,-1,-1,-1,-1],
        [ 2, 2, 2, 2, 2],
        [ 2, 2, 2, 2, 2],
        [ 2, 2, 2, 2, 2],
        [-1,-1,-1,-1,-1]
      ],
      '_': [
        [-1,-1,-1,-1,-1],
        [-1,-1,-1,-1,-1],
        [-1,-1,-1,-1,-1],
        [ 2, 2, 2, 2, 2],
        [ 2, 2, 2, 2, 2]
      ],
      '\\': [
        [ 3, 3,-1,-1,-1],
        [ 3, 3,-1,-1,-1],
        [ 3, 3, 3,-1,-1],
        [-1, 3, 3,-1,-1],
        [-1, 3, 3, 3,-1],
      ],
      '/': [
        [-1, 4, 4, 4,-1],
        [-1, 4, 4,-1,-1],
        [ 4, 4, 4,-1,-1],
        [ 4, 4,-1,-1,-1],
        [ 4, 4,-1,-1,-1]
      ],
    };
    const tinyArtKernels = Object.keys(artKernels3x3).reduce((kernels, char) => {
      kernels[char] = new Map([
        [3, artKernels3x3[char]],
        [5, artKernels5x5[char]]
      ]);
      return kernels;
    }, {});
    const commonOddNums = [
      7,9,11,13,15,17,19,21,23,25,27,29,31,33,
      35,37,39,41,43,45,47,49,51,53,55,57,59,61
    ];
    const artKernels = commonOddNums.reduce((kernels, size) => {
      const scaleToSize = (char) => {
        const sources =  [
          kernels[char].get(3), kernels[char].get(5)
        ];
        try {
          return scaleArtKernel(sources, size, char);
        }
        catch (err) {
          console.error(err);
          return null;
        }
      }
      return Object.keys(kernels).reduce((kernels, char) => {
        kernels[char].set(size, scaleToSize(char));
        return kernels;
      }, kernels);
    }, tinyArtKernels);
    this.state = {
      lang: 'en',
      artBuffer: {
        pixels: [],
        height: 0,
        width: 0
      },
      variety: null,
      spriteIndex: 0,
      artKernels: artKernels,
      maxArtKernel: Math.max(...artKernels[' '].keys()),
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
    this.readArtPixel = this.readArtPixel.bind(this);
    this.readMaskPixel = this.readMaskPixel.bind(this);
    this.readMaskShape = this.readMaskShape.bind(this);
  }

  componentDidMount() {
    // TODO RM
    this.ctx = this.todoRef.current.getContext('2d');

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

  async loadPokemonSpecies(nameOrNumber) {
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
      (await this.dex.getPokemonByName(variety) || {}).sprites
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
        const nameOrNumber = returnValidNameOrNumber(n);
        return await this.loadPokemonSpecies(nameOrNumber);
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

  async accessArtBuffer({x, y, w, h}) {
    const sobelFilter = this.sobelRef.current;
    const artBuffer = await (async () => {
      if (this.state.artBuffer.pixels.length > 0) {
        return this.state.artBuffer;
      }
      const artBuffer = await sobelFilter.readAllPixels();
      await new Promise((resolve) => {
        this.setState({artBuffer}, resolve);
      });
      return artBuffer;
    })();

    const rowRange = [...Array(h).keys()];
    const smallBuffer = rowRange.reduce((pixels, iy) => {
      const flip_y = artBuffer.height - (y + iy);
      const start = (flip_y * artBuffer.width + x);
      const end = start + w;
      return pixels.concat(
        [].slice.call(artBuffer.pixels, start * 4, end * 4)
      )
    }, []);
    return smallBuffer;
  }

  resizeArtPixelBounds({x, y, w, h}) {
    const center = {
      x: x + (w / 2),
      y: y + (h / 2)
    }
    // Round to the nearest odd number >= 3
    const new_size = Math.min(
      this.state.maxArtKernel,
      Math.floor(Math.max(h, w, 3) / 2)*2 + 1
    );
    const new_shape = {
      h: new_size, w: new_size
    };
    return {
      ...new_shape,
      x: Math.round(Math.max(0, center.x - (new_shape.w / 2))),
      y: Math.round(Math.max(0, center.y - (new_shape.h / 2)))
    }
  }

  async readArtPixelColumns({x, y, w, h}) {
    const smallBuffer = await this.accessArtBuffer({x, y, w, h});
    const pixelRange = [...Array(w * h).keys()];

    return [...pixelRange.reduce((cols, i4)=> {
      const col = cols.get(i4 % w) || [];
      const pixel = parseArtPixel(smallBuffer, i4);
      return cols.set(i4 % w, col.concat([pixel]));
    }, new Map([])).values()];
  }

  async readArtPixel(artWidthMap, h, x, y) {
    if (!artWidthMap.size) {
      return '?'; //TODO
    }
    const {artKernels} = this.state;
    const artPixelBounds = this.resizeArtPixelBounds({
      x: x,
      y: y,
      w: maxCharMapWidth(artWidthMap),
      h: h
    });
    const pixelColumns = await this.readArtPixelColumns(artPixelBounds);
    const charCounts = [...pixelColumns].reduce((total, column, ix) => {
      return [...artWidthMap].reduce(
        (counts, [char, {w}]) => {
          const kernel = artKernels[char].get(column.length);
          if (ix === 0) {
            console.log(column.length);
            for (let kernel_row of kernel) {
              console.log(JSON.stringify(kernel_row));
            }
          }
          const count = column.reduce(({n, t}, pixel, iy) => {
            return {
              n: n + (kernel[iy][ix] === pixel),// all matching
              t: t + (kernel[iy][ix] >= 0) // of all possible
            };
          }, counts.get(char) || {n: 0, t: 0})
          return counts.set(char, count)
        }
      , total);
    }, new Map([]));
    const charRatios = new Map( 
      [...charCounts].map(([char, {n, t}]) => {
        return [char, n / Math.max(t, 1)];
      })
    );
    const charWeights = {
      ' ': 1
    };
    const lineThickness = 4;
    const defaultWeight = artPixelBounds.h / lineThickness;
    const out = Object.keys(artKernels).reverse().reduce(
      (result, char) => {
        const weightMax = charWeights[result] || defaultWeight;
        const weight = charWeights[char] || defaultWeight;
        const countMax = charRatios.get(result) || 0; 
        const count = charRatios.get(char) || 0;
        if (countMax * weightMax <= count * weight) {
          return char;
        }
        return result;
      }, ''
    );
    // TODO RM
    const [r, g, b] = {
      '?': [255,0,255],
      ' ': [0,0,0],
      '|': [255,255,255],
      '¯': [255,0,0],
      '–': [255,0,0],
      '_': [255,0,0],
      '\\': [0,255,0],
      '/': [0,0,255]
    }[out || '?'];
    this.ctx.clearRect(
      artPixelBounds.x, artPixelBounds.y, artPixelBounds.w, artPixelBounds.h
    );
    this.ctx.fillStyle = "rgba("+r+","+g+","+b+","+(1.0)+")";
    this.ctx.fillRect(
      artPixelBounds.x, artPixelBounds.y, artPixelBounds.w, artPixelBounds.h
    );
    this.ctx.fillStyle = "rgba("+0+","+0+","+0+","+(1.0)+")";
    this.ctx.fillRect(
      artPixelBounds.x + 1, artPixelBounds.y + 1,
      artPixelBounds.w - 2, artPixelBounds.h - 2
    );
    await sleepAsync(5);

    if (!out.length) {
      return '?'; // TODO
    }
    return out;
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
    const {alignment} = this.props;
    const {lang, artKernels} = this.state;
    const label = this.spriteCall(({p}) => {
      return p.getName(lang) || 'DEX ERR ';
    });

    const output = (
        <Output 
          readMaskShape={this.readMaskShape}
          readMaskPixel={this.readMaskPixel}
          readArtPixel={this.readArtPixel}
          label={label.toLocaleLowerCase('en-US')}
          artKernels={artKernels}
          alignment={alignment}
        >
        </Output>
    );
    // TODO
    const {url, canvas} = this.spriteCall(({p,v,s}) => {
      return p.getSprite(v,s) || {};
    });
    // TODO RM
    const width = canvas?.width || 100;
    const height = canvas?.height || 100;
    if (this.ctx) {
      this.ctx.clearRect(0, 0, width, height);
    }
    return (
      <div>
        {true? output : ''}
        <a href={url || '/'}>
          <SobelFilter
            ref={this.sobelRef}
            source={canvas}
            vertex='/vertex.glsl'
            fragment='/fragment.glsl'
          >
          </SobelFilter>
        </a>
        
        <canvas
          width={width} height={height}
          id="todo-remove" ref={this.todoRef}
        > 
        </canvas>

      </div>
    )
  }
}
export default DexOutput;
