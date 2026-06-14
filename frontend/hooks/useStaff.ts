import { useQuery, useMutation, gql } from '@apollo/client';

const GET_STAFF_MEMBERS = gql`
  query GetStaffMembers {
    staffMembers {
      id
      email
      displayName
      role
      status
      createdAt
    }
  }
`;

const CREATE_STAFF = gql`
  mutation CreateStaff($email: String!, $password: String!, $displayName: String!, $role: String) {
    createStaff(email: $email, password: $password, displayName: $displayName, role: $role) {
      id
      displayName
      role
    }
  }
`;

const UPDATE_STAFF_STATUS = gql`
  mutation UpdateStaffStatus($id: ID!, $status: String!) {
    updateStaffStatus(id: $id, status: $status) {
      id
      status
    }
  }
`;

const DELETE_STAFF = gql`
  mutation DeleteStaff($id: ID!) {
    deleteStaff(id: $id)
  }
`;

export interface StaffMember {
  id: string;
  email: string;
  displayName: string;
  role: string;
  status: string;
  createdAt: string;
}

export interface UseStaffReturn {
  staff: StaffMember[];
  loading: boolean;
  error: string | null;
  createStaff: (data: Partial<StaffMember> & { password: string }) => Promise<any>;
  updateStaffStatus: (id: string, status: string) => Promise<any>;
  deleteStaff: (id: string) => Promise<any>;
  refetch: () => void;
}

export function useStaff(): UseStaffReturn {
  const { data, loading, refetch } = useQuery(GET_STAFF_MEMBERS);
  const [create] = useMutation(CREATE_STAFF);
  const [updateStatus] = useMutation(UPDATE_STAFF_STATUS);
  const [remove] = useMutation(DELETE_STAFF);

  const createStaff = async (input: Partial<StaffMember> & { password: string }) => {
    const result = await create({ variables: input });
    refetch();
    return result;
  };

  const updateStaffStatus = async (id: string, status: string) => {
    const result = await updateStatus({ variables: { id, status } });
    refetch();
    return result;
  };

  const deleteStaff = async (id: string) => {
    const result = await remove({ variables: { id } });
    refetch();
    return result;
  };

  return {
    staff: (data?.staffMembers as StaffMember[]) || [],
    loading,
    error: null,
    createStaff,
    updateStaffStatus,
    deleteStaff,
    refetch,
  };
}
