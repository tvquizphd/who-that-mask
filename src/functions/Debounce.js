import debounce from 'debounce-async'; 

const DebounceAsync = (fn, t) => {
  const debounced = debounce(fn, t);
  return async function(...args) {
    return await new Promise((resolve, reject)=>{
      debounced.apply(this, args)
        .then((result)=>{resolve(result)})
        .catch(err => {
          if (err !== 'canceled') {
            reject(err);
          }
          resolve(null);
        });
    });
  }
}
export default DebounceAsync;
