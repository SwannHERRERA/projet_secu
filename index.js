const fs = require("fs");

const inquirer = require("inquirer");

const key_helper = require("./key.js");
const utils_helper = require("./utils_helper.js");

convert_binary = integer => integer.toString(2).padStart(8, "0");

binary_to_int = binary => {
  let sum = Number();
  for (let i = 0; i < binary.length; i += 1) {
    sum += binary[i] * 2 ** i;
  }
  return new Uint8Array([sum]);
};

init_array = nb_of_element => {
  result = [];
  for (let i = 0; i < nb_of_element; i += 1) {
    result[i] = 0;
  }
  return result;
};

NewCompressFile = (path, key) => {
  let readStream = fs.createReadStream(path, { encoding: null });
  const fd = fs.openSync(path + "c", "w");
  let regex = new RegExp(
    ".{1," + utils_helper.IDENTITY_MATRICE_LENGTH + "}",
    "g"
  );
  readStream.on("data", chunk => {
    if (chunk !== null) {
      chunk.forEach(integer => {
        let binary_string = convert_binary(integer);
        binary_string = binary_string.match(regex);
        binary_string.forEach(group_of_bits => {
          let result = init_array(utils_helper.LENGTH_REFERENCE);
          for (let i = 0; i < group_of_bits.length; i += 1) {
            if (group_of_bits[i] === "1") {
              for (let j = 0; j < key[i].length; j += 1) {
                if (key[i][j] === "1") {
                  if (result[j] === 1) {
                    result[j] = 0;
                  } else {
                    result[j] = 1;
                  }
                }
              }
            }
          }
          fs.writeSync(fd, binary_to_int(result.reverse()), null, null);
        });
      });
    }
  });
  readStream.on("end", () => {
    console.timeEnd("chiffrement");
  });
};

makeOctets = array_of_bit => {
  let new_array = new Array(Math.ceil(array_of_bit.length / 8));
  for (let i = 0; i < new_array.length; i += 1) {
    new_array[i] = [];
  }
  let compteur_octet = 0;
  let compteur_bit = 0;
  for (let i = 0; i < array_of_bit.length; i += 1) {
    new_array[compteur_octet][compteur_bit] = array_of_bit[i];
    compteur_bit += 1;
    if (compteur_bit >= 8) {
      compteur_bit = 0;
      compteur_octet += 1;
    }
  }
  if (new_array[compteur_octet] !== undefined) {
    throw new Error("Taille de clé incorrect");
  }
  for (let i = 0; i < new_array.length; i += 1) {
    new_array[i] = binary_to_int(new_array[i].reverse());
    console.log(new_array[i]);
  }
  return new Uint8Array(new_array);
};

unCompressFileOld = (path, identity_matrice) => {
  let readStream = fs.createReadStream(path + "c", { encoding: null });
  let writeStream = fs.createWriteStream(path, { encoding: null });
  let result = [];
  readStream.on("data", chunk => {
    if (chunk !== null) {
      chunk.forEach(integer => {
        const octets = convert_binary(integer);
        identity_matrice.forEach(number => {
          result.push(Number(octets[number]));
        });
      });
      const results = makeOctets(result);
      console.log(results);
      writeStream.write(results);
    }
  });
  readStream.on("end", () => {
    console.timeEnd("déchiffrement");
  });
};

unCompressFile = (path, identity_matrice) => {
  let readStream = fs.createReadStream(path + "c", { encoding: null });
  let writeStream = fs.createWriteStream(path, { encoding: null });
  readStream.on("data", chunk => {
    if (chunk !== null) {
      result = [];
      for (let i = 0; i < chunk.length; i += 2) {
        let binary_number = convert_binary(chunk[i]);
        console.log(binary_number);
        let string = "";
        identity_matrice.forEach(j => {
          string = string.concat(binary_number[j]);
        });
        identity_matrice.forEach(j => {
          // j start at 1
          string = string.concat(binary_number[j + 3]);
        });
        result.push(string);
      }
      for (let i = 0; i < result.length; i += 1) {
        result[i] = parseInt(result[i], 2);
      }
      const Buffer = new Uint8Array(result);
      writeStream.write(Buffer);
    }
  });
  readStream.on("end", () => {
    console.log(result);
    console.timeEnd("déchiffrement");
  });
};

inquirer
  .prompt([
    {
      type: "list",
      name: "action",
      message: "What do you want to do ?",
      choices: ["chiffrer", "déchiffer"]
    }
  ])
  .then(answers_1 => {
    inquirer
      .prompt([
        {
          name: "path",
          message: "what's the path to your file ?",
          default: "./EPREUVE 1.txt"
        }
      ])
      .then(answers_2 => {
        if (answers_1.action == "chiffrer") {
          // mode chiffrement
          console.time("chiffrement");
          const key = key_helper.getKey("./G4C.txt");
          NewCompressFile(answers_2.path, key);
        } else {
          // mode déchiffrement
          console.time("déchiffrement");
          const key = key_helper.getKey("./G4C.txt");
          const identity_matrice = key_helper.getIdentityMatrice(key);
          unCompressFileOld(answers_2.path, identity_matrice);
        }
      });
  });
