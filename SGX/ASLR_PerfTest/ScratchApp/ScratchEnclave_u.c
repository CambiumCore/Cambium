#include "ScratchEnclave_u.h"
#include <errno.h>

typedef struct ms_initialize_t {
	sgx_status_t ms_retval;
} ms_initialize_t;

typedef struct ms_generate_hasharray_t {
	sgx_status_t ms_retval;
	size_t ms_numhashes;
} ms_generate_hasharray_t;

typedef struct ms_doASLR_t {
	sgx_status_t ms_retval;
} ms_doASLR_t;

typedef struct ms_ocall_print_string_t {
	const char* ms_str;
} ms_ocall_print_string_t;

typedef struct ms_sgx_oc_cpuidex_t {
	int* ms_cpuinfo;
	int ms_leaf;
	int ms_subleaf;
} ms_sgx_oc_cpuidex_t;

typedef struct ms_sgx_thread_wait_untrusted_event_ocall_t {
	int ms_retval;
	const void* ms_self;
} ms_sgx_thread_wait_untrusted_event_ocall_t;

typedef struct ms_sgx_thread_set_untrusted_event_ocall_t {
	int ms_retval;
	const void* ms_waiter;
} ms_sgx_thread_set_untrusted_event_ocall_t;

typedef struct ms_sgx_thread_setwait_untrusted_events_ocall_t {
	int ms_retval;
	const void* ms_waiter;
	const void* ms_self;
} ms_sgx_thread_setwait_untrusted_events_ocall_t;

typedef struct ms_sgx_thread_set_multiple_untrusted_events_ocall_t {
	int ms_retval;
	const void** ms_waiters;
	size_t ms_total;
} ms_sgx_thread_set_multiple_untrusted_events_ocall_t;

static sgx_status_t SGX_CDECL ScratchEnclave_ocall_print_string(void* pms)
{
	ms_ocall_print_string_t* ms = SGX_CAST(ms_ocall_print_string_t*, pms);
	ocall_print_string(ms->ms_str);

	return SGX_SUCCESS;
}

static sgx_status_t SGX_CDECL ScratchEnclave_sgx_oc_cpuidex(void* pms)
{
	ms_sgx_oc_cpuidex_t* ms = SGX_CAST(ms_sgx_oc_cpuidex_t*, pms);
	sgx_oc_cpuidex(ms->ms_cpuinfo, ms->ms_leaf, ms->ms_subleaf);

	return SGX_SUCCESS;
}

static sgx_status_t SGX_CDECL ScratchEnclave_sgx_thread_wait_untrusted_event_ocall(void* pms)
{
	ms_sgx_thread_wait_untrusted_event_ocall_t* ms = SGX_CAST(ms_sgx_thread_wait_untrusted_event_ocall_t*, pms);
	ms->ms_retval = sgx_thread_wait_untrusted_event_ocall(ms->ms_self);

	return SGX_SUCCESS;
}

static sgx_status_t SGX_CDECL ScratchEnclave_sgx_thread_set_untrusted_event_ocall(void* pms)
{
	ms_sgx_thread_set_untrusted_event_ocall_t* ms = SGX_CAST(ms_sgx_thread_set_untrusted_event_ocall_t*, pms);
	ms->ms_retval = sgx_thread_set_untrusted_event_ocall(ms->ms_waiter);

	return SGX_SUCCESS;
}

static sgx_status_t SGX_CDECL ScratchEnclave_sgx_thread_setwait_untrusted_events_ocall(void* pms)
{
	ms_sgx_thread_setwait_untrusted_events_ocall_t* ms = SGX_CAST(ms_sgx_thread_setwait_untrusted_events_ocall_t*, pms);
	ms->ms_retval = sgx_thread_setwait_untrusted_events_ocall(ms->ms_waiter, ms->ms_self);

	return SGX_SUCCESS;
}

static sgx_status_t SGX_CDECL ScratchEnclave_sgx_thread_set_multiple_untrusted_events_ocall(void* pms)
{
	ms_sgx_thread_set_multiple_untrusted_events_ocall_t* ms = SGX_CAST(ms_sgx_thread_set_multiple_untrusted_events_ocall_t*, pms);
	ms->ms_retval = sgx_thread_set_multiple_untrusted_events_ocall(ms->ms_waiters, ms->ms_total);

	return SGX_SUCCESS;
}

static const struct {
	size_t nr_ocall;
	void * func_addr[6];
} ocall_table_ScratchEnclave = {
	6,
	{
		(void*)(uintptr_t)ScratchEnclave_ocall_print_string,
		(void*)(uintptr_t)ScratchEnclave_sgx_oc_cpuidex,
		(void*)(uintptr_t)ScratchEnclave_sgx_thread_wait_untrusted_event_ocall,
		(void*)(uintptr_t)ScratchEnclave_sgx_thread_set_untrusted_event_ocall,
		(void*)(uintptr_t)ScratchEnclave_sgx_thread_setwait_untrusted_events_ocall,
		(void*)(uintptr_t)ScratchEnclave_sgx_thread_set_multiple_untrusted_events_ocall,
	}
};

sgx_status_t initialize(sgx_enclave_id_t eid, sgx_status_t* retval)
{
	sgx_status_t status;
	ms_initialize_t ms;
	status = sgx_ecall(eid, 0, &ocall_table_ScratchEnclave, &ms);
	if (status == SGX_SUCCESS && retval) *retval = ms.ms_retval;
	return status;
}

sgx_status_t generate_hasharray(sgx_enclave_id_t eid, sgx_status_t* retval, size_t numhashes)
{
	sgx_status_t status;
	ms_generate_hasharray_t ms;
	ms.ms_numhashes = numhashes;
	status = sgx_ecall(eid, 1, &ocall_table_ScratchEnclave, &ms);
	if (status == SGX_SUCCESS && retval) *retval = ms.ms_retval;
	return status;
}

sgx_status_t doASLR(sgx_enclave_id_t eid, sgx_status_t* retval)
{
	sgx_status_t status;
	ms_doASLR_t ms;
	status = sgx_ecall(eid, 2, &ocall_table_ScratchEnclave, &ms);
	if (status == SGX_SUCCESS && retval) *retval = ms.ms_retval;
	return status;
}

