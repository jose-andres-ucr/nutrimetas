import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { showMessage } from "react-native-flash-message";
import Colors from "@/constants/Colors";
import Collections from "@/constants/Collections";

// User session
import { UserData, UserRole } from "@/shared/LoginSession";

// Firebase Authentication
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';

// Firebase Firestore DB 
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

export type CommonType = {
  id: string;
  name: string;
};

export const fetchDropDownData = async (collectionName: string) => {
  const snapshot = await firestore().collection(collectionName).get();
  const collectionData: CommonType[] =  snapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().Name
  }));
  return collectionData;
};

export const useDropDownDataFirestoreQuery = (collectionName: string) => {
  const queryKey = [collectionName] as const;
  const queryClient = useQueryClient();

  const { data, error, isLoading } = useQuery<CommonType[]>({
    queryKey,
    queryFn: () => fetchDropDownData(collectionName),
  });
  
  useEffect(() => {
    const unsubscribe = firestore()
      .collection(collectionName)
      .onSnapshot((collectionSnapshot) => {
        const updatedData = collectionSnapshot.docs.map((doc) => {
          const docData = doc.data();
          return {
            id: doc.id,
            name: docData.Name,
          };
        });
        queryClient.setQueryData(queryKey, updatedData);
      });

    return () => {
      unsubscribe();
    };
  }, []);

  return { data, error, isLoading };
};

const fetchReferenceData = async (collection: string, docId: string) => {
  const doc = await firestore().collection(collection).doc(docId).get();
  return doc.exists ? doc.data() : null;
};

const fetchDescriptionGoal = async (goalData: FirebaseFirestoreTypes.DocumentData) => {
  try {
    const fetchAllReferences = [
      fetchReferenceData(Collections.Type, goalData.Type),
      fetchReferenceData(Collections.Action, goalData.Action),
      fetchReferenceData(Collections.Rubric, goalData.Rubric),
      fetchReferenceData(Collections.Amount, goalData.Amount),
      fetchReferenceData(Collections.Portion, goalData.Portion),
      fetchReferenceData(Collections.Frequency, goalData.Frequency)
    ];

    const [
        typeData,
        actionData,
        rubricData,
        amountData,
        portionData,
        frequencyData
    ] = await Promise.all(fetchAllReferences);

    if (!typeData || !actionData || !rubricData || !amountData || !portionData || !frequencyData) {
        console.error('Missing data for building description');
        return '';
    }

    const typePrefix = (typeData.Name === 'Aumentar' || typeData.Name === 'Disminuir') ? 'a' : 'en';
    const portionName = (amountData.Value === 1) ? portionData.Name : portionData.Plural;

    return `${typeData.Name} ${actionData.Name} ${rubricData.Name} ${typePrefix} ${amountData.Value} ${portionName} ${frequencyData.Name}`;
  } catch (error) {
      console.error('Error building description:', error);
      return '';
  }
};

const fetchRubricGoal = async (rubricRef: string) => {
  try {
      const rubricData = await fetchReferenceData(Collections.Rubric, rubricRef);
      if (!rubricData) {
          throw new Error('Rubric data is missing');
      }    
      return rubricData.Name;
  } catch (error) {
      console.error('Error fetching rubric:', error);
      return 'Meta';
  }
};

const processGoalsSnapshot = async (snapshot: FirebaseFirestoreTypes.QuerySnapshot) => {
  const goalsListPromises = snapshot.docs.map(async doc => {
      const goalData = doc.data();
      const rubricGoal = await fetchRubricGoal(goalData.Rubric);
      const descriptionGoal = await fetchDescriptionGoal(goalData);
      return { id: doc.id, rubric: rubricGoal, description: descriptionGoal };
  });

  const goalsList = await Promise.all(goalsListPromises);
  return goalsList;
};

const fetchGoals = async () => {
  const snapshot = await firestore().collection(Collections.Goal).where('Template', '==', true).get();
  return processGoalsSnapshot(snapshot);
};

export const useGoalFirestoreQuery = () => {
  const queryClient = useQueryClient();
  const queryKey = ['goals'] as const;

  const { data, error, isLoading } = useQuery({
    queryKey,
    queryFn: fetchGoals,
 });

  useEffect(() => {
    const unsubscribe = firestore()
      .collection(Collections.Goal)
      .where('Template', '==', true)
      .onSnapshot(
          async snapshot => {
              try {
                  const goalsList = await processGoalsSnapshot(snapshot);
                  queryClient.setQueryData(queryKey, goalsList);
              } catch (error) {
                  console.error("Error fetching goals: ", error);
              }
          },
          error => {
              console.error("Error fetching goals: ", error);
          }
      );

    return () => {
      unsubscribe();
    };
  }, []);

  return { data, error, isLoading };
};

const normalizeString = (str: string) => {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
};

const sortPatients = (patientsList: any[]) => {
  return patientsList.sort((a, b) => {
      const lastNameA = normalizeString(a.lastName);
      const lastNameB = normalizeString(b.lastName);
      if (lastNameA < lastNameB) return -1;
      if (lastNameA > lastNameB) return 1;
      return 0;
  });
};

const fetchPatients = async () => {
  const snapshot = await firestore().collection(Collections.Patient).get();
  const patients = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  return sortPatients(patients);
};

export const useCheckBoxPatientsFirestoreQuery = () => {
  const queryClient = useQueryClient();
  const queryKey = ['patients'] as const;

  const { data, error, isLoading } = useQuery({
      queryKey,
      queryFn: fetchPatients,
  });

  useEffect(() => {
    const unsubscribe = firestore()
        .collection(Collections.Patient)
        .onSnapshot(
            snapshot => {
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                queryClient.setQueryData(queryKey, sortPatients(data));
            },
            error => {
                console.error("Error fetching patients: ", error);
                showMessage({
                    type: "danger",
                    message: "Error",
                    description: "Hubo un problema al obtener los datos de los pacientes.",
                    backgroundColor: Colors.red,
                    color: Colors.white,
                });
            }
        );

    return () => {
        unsubscribe();
    };
  }, []);

  return { data, error, isLoading };
};

/**
 * Fetch the data of a given user with their associated email
 * @param email The users email address
 * @return A Promise associated with the data retrieval
*/
export const fetchUserData = function (email : string) : Promise<UserData> {
	// Both DB errors arising from the access promise and unexpected
	//  ones arising from asignment are dealt with the same
	const handleDbError = (dbError : Error) => { return Promise.reject(dbError) };

	// DB errors arising from missing user data are dealt with slightly
	// differently
	const fetchUserInCollection = function (queryResult : any, collectionRole : UserRole) {
		if (queryResult.docs.length === 1) {
			return {doc : queryResult.docs[0], role : collectionRole};
		}

		return Promise.reject(
			Error("No se encontraron los datos del usuario para el rol de" 
			+ collectionRole
		));
	};

	// Find the data as a patient...
	const patientDataFound = firestore()
		.collection("Patient")
		.where("email", "==", email)
		.limit(1)
		.get()
		.then((res) => fetchUserInCollection(res, "patient"), handleDbError);

	// Or a professional
	const professionalDataFound = firestore()
		.collection("Professionals")
		.where("email", "==", email)
		.limit(1)
		.get()
		.then((res) => fetchUserInCollection(res, "professional"), handleDbError);

	// Pick the data that fits, or report that none was found is that was
	// the case
	return Promise.any([patientDataFound, professionalDataFound])
	.then(
		(queryResults) => {    
		// Construct the user data according to which collection
		// the user's data sheet belongs to
		const {doc, role} = queryResults;
		return {
			docId : doc.id, 
			role: role,
			docContents: doc.data,
		}
		},
		handleDbError
	)
	.catch(handleDbError);
}

/**
 * Authenticate a given user with their associated email and password
 * @param email The users account email address
 * @param password The users account password
 * @return A Promise associated with the authentication attempt
*/
export const authUser = function (email: string, password : string) 
: Promise<string> {
    return auth()
		.signInWithEmailAndPassword(email, password)
        .then(
            (Credentials : FirebaseAuthTypes.UserCredential) => {
                return Credentials.user.uid;
            }, 
            (authError) => {
                return Promise.reject(authError);
            }
        );
}

/**
 * Keep track of the currently-authenticated user
 * @return Credentials of currently-authenticated user
*/
export const useAuthUser = function () {
	// Keep track of the currently authenticated user
	const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
	
	// Make sure to detect changes on the user via stored credentials
	// TODO: Track changes in things other than UID
	useEffect(() => {
		const authUnsuscriber = auth()
		  .onAuthStateChanged(
			  (User) => {
				  if (User?.uid !== user?.uid) {
					setUser(User)
				  }
			  }
		  );
  
		return authUnsuscriber;
	}, []);

	return user;
}