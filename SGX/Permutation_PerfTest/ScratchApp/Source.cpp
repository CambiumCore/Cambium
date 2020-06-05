#include <stdio.h>
#include <tchar.h>
#include <string>
#include <stdlib.h>
#include <iostream>
#include <cstdlib>
#include <chrono>
#include "sgx_urts.h"
#include "ScratchEnclave_u.h"
#define ENCLAVE_FILE _T("ScratchEnclave.signed.dll")

using namespace std::chrono;
int main() {
	sgx_enclave_id_t eid;
	sgx_status_t ret = SGX_SUCCESS;
	sgx_status_t innerret = SGX_SUCCESS;
	sgx_launch_token_t token = { 0 };
	int updated = 0;
	// Create the Enclave with above launch token.
	ret = sgx_create_enclave(ENCLAVE_FILE, SGX_DEBUG_FLAG, &token, &updated, &eid, NULL);
	if (ret != SGX_SUCCESS) {
		printf("App: error %#x, failed to create enclave.\n", ret);
		getchar();
		return -1;
	}
	size_t numhashes = 500; 

	FILE* pFile;
	fopen_s(&pFile, "perftest.csv", "wb");
	std::string towrite = "Operation, NumHashes, iteration, time taken (microseconds)\n";
	char *tarray = &towrite[0];
	fwrite(tarray, 1, towrite.length(), pFile);
	for (int i = 0; i < 10; i++) {
		towrite = "";
		auto start = high_resolution_clock::now();
		ret = initialize(eid, &innerret);
		if (ret != SGX_SUCCESS || innerret != SGX_SUCCESS) {
			printf("\nERROR INITIALIZING\n");
			getchar();
			return -1;
		}
		auto stop = high_resolution_clock::now();
		auto duration = duration_cast<microseconds>(stop - start);

		std::cout << "Time taken by initialize function: "
			<< duration.count() << " microseconds" << std::endl;
		towrite = "initialize,N/A,";
		towrite = towrite + std::to_string(i+1);
		towrite = towrite + ",";
		towrite = towrite + std::to_string(duration.count());
		towrite = towrite + "\n";
		tarray = &towrite[0];
		fwrite(tarray, 1, towrite.length(), pFile);
	}

	for (int i = 0; i < 1; i++) {
		towrite = "";
		auto start = high_resolution_clock::now();
		ret = generate_hasharray(eid, &innerret, numhashes);
		if (ret != SGX_SUCCESS || innerret != SGX_SUCCESS) {
			printf("\nERROR GENERATING HASH ARRAY\n");
			getchar();
			return -1;
		}
		auto stop = high_resolution_clock::now();
		auto duration = duration_cast<microseconds>(stop - start);

		std::cout << "Time taken by generation function: "
			<< duration.count() << " microseconds" << std::endl;
		towrite = "generate,";
		towrite = towrite + std::to_string(numhashes);
		towrite = towrite + ",";
		towrite = towrite + std::to_string(i + 1);
		towrite = towrite + ",";
		towrite = towrite + std::to_string(duration.count());
		towrite = towrite + "\n";
		tarray = &towrite[0];
		fwrite(tarray, 1, towrite.length(), pFile);
	}

	for (int i = 0; i < 100; i++) {
		towrite = "";
		auto start = high_resolution_clock::now();
		ret = doASLR(eid, &innerret);
		if (ret != SGX_SUCCESS || innerret != SGX_SUCCESS) {
			printf("\nERROR DOING ASLR\n");
			getchar();
			return -1;
		}
		auto stop = high_resolution_clock::now();
		auto duration = duration_cast<microseconds>(stop - start);
		
		std::cout << "Time taken by doASLR function: "
			<< duration_cast<microseconds>(duration).count() << " microseconds" << std::endl;
		towrite = "ASLR,";
		towrite = towrite + std::to_string(numhashes);
		towrite = towrite + ",";
		towrite = towrite + std::to_string(i + 1);
		towrite = towrite + ",";
		towrite = towrite + std::to_string(duration.count());
		towrite = towrite + "\n";
		tarray = &towrite[0];
		fwrite(tarray, 1, towrite.length(), pFile);
	}

	if (SGX_SUCCESS != sgx_destroy_enclave(eid))
		return -1;
	printf("Enter a character before exit ...\n");
	getchar();
	fclose(pFile);
	return 0;

}
/* OCall function to print to console*/
void ocall_print_string(const char *str)
{
	/* Proxy/Bridge will check the length and null-terminate
	* the input string to prevent buffer overflow.
	*/
	printf("%s", str);
}