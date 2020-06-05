#include "ScratchEnclave_t.h"

#include "sgx_trts.h"
#include <string>
#include <cstdlib>
#include <stdio.h>
#include <sgx_tseal.h>
#define MAX_ADDRESSES 10000

sgx_sha256_hash_t CRt;
uint8_t concatspace[64];
sgx_sha256_hash_t addresses[MAX_ADDRESSES];
sgx_sha256_hash_t permuted[MAX_ADDRESSES];
size_t numhash;
std::string charray_to_string(char* in, size_t len);
/*
* printf:
*   Invokes OCALL to display the enclave buffer to the terminal.
*/
void printf(const char *fmt, ...)
{
	char buf[BUFSIZ] = { '\0' };
	va_list ap;
	va_start(ap, fmt);
	vsnprintf(buf, BUFSIZ, fmt, ap);
	va_end(ap);
	ocall_print_string(buf);
}

//Here we initialize an array of hashes as well as a cycle root hash
sgx_status_t initialize()
{
	sgx_status_t ret = SGX_SUCCESS;
	uint8_t temp = 1;
	ret = sgx_sha256_msg(&temp, 1, &CRt);
	if (ret != SGX_SUCCESS)
		return ret;
	return ret;
}

sgx_status_t generate_hasharray(size_t numhashes) {
	sgx_status_t ret = SGX_SUCCESS;
	numhash = numhashes;
	//This preps the concatspace array that we will use in aslr
	for (int j = 0; j < 32; j++) {
		concatspace[j] = CRt[j];
	}
	for (uint8_t i = 0; i < numhashes; i++) {
		ret = sgx_sha256_msg(&i, 1, &addresses[i]);
		if (ret != SGX_SUCCESS)
			return ret;
	}
	return ret;
}

sgx_status_t doASLR() {
	sgx_status_t ret = SGX_SUCCESS;
	for (uint8_t i = 0; i < numhash; i++) {
		//Create CR||input
		for (int j = 0; j < 32; j++) {
			concatspace[32+j] = permuted[i][j];
		}
		//Calculate hash
		ret = sgx_sha256_msg(concatspace, 32, &permuted[i]);
		if (ret != SGX_SUCCESS)
			return ret;
	}
	return ret;
}

std::string charray_to_string(char* in, size_t len) {
	std::string toret = "";
	for (int i = 0; i < len; i++) {
		toret = toret + in[i];
	}
	return toret;
}