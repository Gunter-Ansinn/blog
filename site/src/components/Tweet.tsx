import { Tweet as ReactTweet, TweetNotFound } from 'react-tweet'
import 'react-tweet/theme.css'

interface Props {
  id: string
}

export default async function Tweet({ id }: Props) {
  try {
    return (
      <div className="tweet-wrapper">
        <ReactTweet id={id} />
      </div>
    )
  } catch {
    return <TweetNotFound />
  }
}
