import { useQuery } from "@tanstack/react-query";
import type { Observation } from "fhir/r4";

const BASE_URL = 'https://hapi.fhir.org'

export default function FetchTestPage() {

  const id = 48683250;

  const {
    data: observation,
    isError,
    isPending,
  } = useQuery({
    queryKey: [],
    queryFn: async () => {
      const response = await fetch(`${BASE_URL}/baseR4/Observation/${id}`);
      return (await response.json()) as Observation;
    }
  });

  if (!isPending) {
    const deviceDisplay = observation?.device?.display
    const componentDisplay = observation?.component?.at(0)?.code.coding?.at(0)?.display
    const period = observation?.component?.at(0)?.valueSampledData?.period
    const data = observation?.component?.at(0)?.valueSampledData?.data

    console.log(deviceDisplay)
    console.log(componentDisplay)
    console.log(period)
    console.log(data)
    console.log(observation)
  }

  return (
    <>
      <h1>FHIR ECG Test!</h1>
      <div>{JSON.stringify(observation)}</div>
    </>
  );
}