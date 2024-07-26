const roles = require('../config/roles.json');
const { cpf, cep } = require('cpf-cnpj-validator');

class Validator {
	static isCPF = (input) => {
		const num = input.replace(/[^\d]/g, '');
		return cpf.isValid(num);
	};

	static isRole = (role) => roles.includes(role);

	static isArrayOfRoles = (arr) => {
		if (!Array.isArray(arr) || arr.length == 0) {
			return false;
		}
		return arr.every(this.isRole);
	};
}

module.exports = Validator;
