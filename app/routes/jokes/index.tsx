import { Joke } from '@prisma/client';
import { Link, LoaderFunction, useLoaderData } from 'remix';
import { db } from '~/utils/db.server';

type LoaderData = { joke: Joke };

export const loader: LoaderFunction = async ({ params }) => {
    const count = await db.joke.count();
    const randomRowNumber = Math.floor(Math.random() * count);
    const [randomJoke] = await db.joke.findMany({
        take: 1,
        skip: randomRowNumber,
    })
    if (!randomJoke) throw new Error('Joke not found');
    const data: LoaderData = { joke: randomJoke };
    return data;
}
export default function JokesIndexRoute() {
    const data: LoaderData = useLoaderData<LoaderData>();
    return (
        <div>
            <p>Here's a random joke:</p>
            <p>
                {data.joke.content}
            </p>
            <Link to={data.joke.id}>
                {data.joke.name} Permalink
            </Link>
        </div>
    );
}

export function ErrorBoundary({ error }: { error: Error }) {
    return (
        <div className="error-container">
            I did a whoopsies.
        </div>
    )
}