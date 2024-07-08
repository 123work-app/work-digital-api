class Validator {
	static checkCPF = (cpf) => {
		cpf = cpf.replace(/[^\d]/g, '');
		if (cpf.length !== 11) return false;
		if (cpf === '00000000000') return false;

		let sum = 0;
		let mod = 0;

		for (let i = 1; i <= 9; i++) {
			sum = sum + parseInt(cpf.substring(i - 1, i)) * (11 - i);
		}
		mod = (sum * 10) % 11;

		if (mod == 10 || mod == 11) {
			mod = 0;
		}

		if (mod != parseInt(cpf.substring(9, 10))) return false;

		sum = 0;
		for (let i = 1; i <= 10; i++) {
			sum = sum + parseInt(cpf.substring(i - 1, i)) * (12 - i);
		}
		mod = (sum * 10) % 11;

		if (mod == 10 || mod == 11) {
			mod = 0;
		}

		if (mod != parseInt(cpf.substring(10, 11))) return false;
		return true;
	};
}

module.exports = Validator;
