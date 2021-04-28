const constMapInsert = (a, i, v) => {
  return new Map([ ...a, [i, v] ]);
};

const constListReplace = (a, i, v) => {
  return a.map((_v, _i) => {
    return (_i === i) ? v : _v;
  });
}

export {
  constMapInsert,
  constListReplace
}
