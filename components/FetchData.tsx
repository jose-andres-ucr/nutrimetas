import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { showMessage } from "react-native-flash-message";
import Colors from "@/constants/Colors";
import Collections from "@/constants/Collections";

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